/**
 * daily + · DATA LAYER
 * ------------------------------------------------------------------
 * Web 的 lib/use-app-data.ts 的原生对应物：同名 hook、同样的读写语义、
 * 同样的乐观更新与跨屏刷新。屏幕代码只从这里取数据，不直接碰 fetch。
 *
 * 两处刻意保留的原生差异：
 *   - window 的 CustomEvent 换成进程内事件总线（@/data/bus）；
 *   - Web 的 6 秒兜底定时器不再需要，apiGet 自带 4.5 秒超时。
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { todayISO } from '@/domain/date';

import { emitDataEvent, subscribeData, type DataEvent } from './bus';
import { apiDelete, apiGet, apiPatch, apiPost, apiSend, subscribeAuthToken } from './client';
import {
  EMPTY_HISTORY,
  EMPTY_STATS,
  type Checkin,
  type Recipe,
  type RecipeHistory,
  type Stats,
  type TaxonomyItem,
  type TaxonomyKind,
} from './types';

/** 本次会话里刚写入的记录：切换页面不会丢，也不用等下一次拉取 */
let sessionCheckins: Checkin[] = [];
let sessionRecipes: Recipe[] = [];

/** 退出登录时必须清空，下一位登录者不能看到上一位的数据 */
export function resetDataCaches() {
  sessionCheckins = [];
  sessionRecipes = [];
}

function useDataEvents(handler: (event: DataEvent) => void) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => subscribeData((event) => ref.current(event)), []);
}

/** 会话开始时重新拉取：登录 / 换账号 / 退出都走这里 */
function useAuthTokenEvents(handler: () => void) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => subscribeAuthToken(() => ref.current()), []);
}

function mergeCheckins(day: string, fromServer: Checkin[]): Checkin[] {
  const ids = new Set(fromServer.map((c) => c.id));
  const extra = sessionCheckins.filter((c) => c.day === day && !ids.has(c.id));
  return [...extra, ...fromServer].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

/* ------------------------------------------------------------------ */
/* 菜谱                                                                */
/* ------------------------------------------------------------------ */
export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await apiGet<{ recipes?: Recipe[] }>('/api/recipes');
    if (Array.isArray(data?.recipes)) {
      const slugs = new Set(data.recipes.map((r) => r.slug));
      setRecipes([...sessionRecipes.filter((r) => !slugs.has(r.slug)), ...data.recipes]);
    }
    setLoading(false);
  }, []);

  // 与 Web 相同：把首次拉取推迟到渲染之后，避免在 effect 体内同步 setState
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  useAuthTokenEvents(() => void load());

  // 打卡会派生菜谱的「做过几次 / 上次做于」，必须跟着刷
  useDataEvents((event) => {
    if (event.type === 'recipes' || event.type === 'checkins') void load();
  });

  const addRecipe = useCallback(async (draft: Recipe) => {
    sessionRecipes = [draft, ...sessionRecipes.filter((r) => r.slug !== draft.slug)];
    setRecipes((list) => [draft, ...list.filter((r) => r.slug !== draft.slug)]);
    const res = await apiPost<{ recipe?: Recipe }>('/api/recipes', draft);
    const saved = res.ok ? res.data.recipe : undefined;
    if (saved) {
      sessionRecipes = sessionRecipes.filter((r) => r.slug !== draft.slug);
      setRecipes((list) => list.map((r) => (r.slug === draft.slug ? saved : r)));
    }
    emitDataEvent({ type: 'recipes' });
    return saved ?? draft;
  }, []);

  const updateRecipe = useCallback(async (slug: string, draft: Recipe) => {
    const optimistic: Recipe = { ...draft, slug };
    sessionRecipes = [optimistic, ...sessionRecipes.filter((r) => r.slug !== slug)];
    setRecipes((list) => list.map((r) => (r.slug === slug ? optimistic : r)));
    const res = await apiPatch<{ recipe?: Recipe }>(
      `/api/recipes?slug=${encodeURIComponent(slug)}`,
      optimistic
    );
    const saved = res.ok && res.data.recipe ? res.data.recipe : optimistic;
    sessionRecipes = sessionRecipes.filter((r) => r.slug !== slug);
    setRecipes((list) => list.map((r) => (r.slug === slug ? saved : r)));
    emitDataEvent({ type: 'recipes' });
    return saved;
  }, []);

  const deleteRecipe = useCallback(async (slug: string) => {
    sessionRecipes = sessionRecipes.filter((r) => r.slug !== slug);
    setRecipes((list) => list.filter((r) => r.slug !== slug));
    await apiDelete<{ ok: boolean }>(`/api/recipes?slug=${encodeURIComponent(slug)}`);
    emitDataEvent({ type: 'recipes' });
  }, []);

  return { recipes, loading, addRecipe, updateRecipe, deleteRecipe, refresh: load };
}

/* ------------------------------------------------------------------ */
/* 打卡                                                                */
/* ------------------------------------------------------------------ */
export function useCheckins(day: string = todayISO()) {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await apiGet<{ checkins?: Checkin[] }>(
      `/api/checkins?day=${encodeURIComponent(day)}`
    );
    setCheckins(
      Array.isArray(data?.checkins) ? mergeCheckins(day, data.checkins) : mergeCheckins(day, [])
    );
    setLoading(false);
  }, [day]);

  // 与 Web 相同：切日期后先清空再拉取，推迟到渲染之后执行
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setCheckins([]);
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [day, load]);

  useAuthTokenEvents(() => void load());

  useDataEvents((event) => {
    if (event.type !== 'checkins') return;
    if (!event.day || event.day === day) void load();
  });

  const addCheckin = useCallback(
    async (
      draft: Omit<Checkin, 'id' | 'time' | 'note' | 'planned' | 'photoId'> & {
        time?: string;
        note?: string;
        planned?: boolean;
        photoId?: number | null;
      }
    ) => {
      const optimistic: Checkin = {
        id: Date.now(),
        time: draft.time ?? new Date().toTimeString().slice(0, 5),
        note: draft.note ?? '',
        planned: draft.planned ?? false,
        photoId: draft.photoId ?? null,
        ...draft,
      };
      sessionCheckins = [...sessionCheckins, optimistic];
      if (draft.day === day) setCheckins((list) => [...list, optimistic]);

      const res = await apiPost<{ checkin?: Checkin }>('/api/checkins', optimistic);
      const saved = res.ok ? res.data.checkin : undefined;
      if (saved) {
        sessionCheckins = sessionCheckins.filter((c) => c.id !== optimistic.id);
        sessionCheckins = [...sessionCheckins, saved];
        if (draft.day === day) {
          setCheckins((list) => list.map((c) => (c.id === optimistic.id ? saved : c)));
        }
      }
      emitDataEvent({ type: 'checkins', day: draft.day });
      return saved ?? optimistic;
    },
    [day]
  );

  /** 就地修改一条记录；也用于把计划（planned）确认为已吃 */
  const patchCheckin = useCallback(
    async (id: number, patch: Partial<Omit<Checkin, 'id'>>, recordDay: string = day) => {
      sessionCheckins = sessionCheckins.map((c) => (c.id === id ? { ...c, ...patch } : c));
      if (recordDay === day) {
        setCheckins((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      }
      const res = await apiPatch<{ checkin?: Checkin }>(`/api/checkins?id=${id}`, patch);
      const saved = res.ok ? res.data.checkin : undefined;
      if (saved) {
        sessionCheckins = sessionCheckins.map((c) => (c.id === id ? saved : c));
        if (recordDay === day) {
          setCheckins((list) => list.map((c) => (c.id === id ? saved : c)));
        }
      }
      emitDataEvent({ type: 'checkins', day: patch.day ?? recordDay });
      return saved;
    },
    [day]
  );

  const removeCheckin = useCallback(
    async (id: number, recordDay: string = day) => {
      sessionCheckins = sessionCheckins.filter((c) => c.id !== id);
      if (recordDay === day) setCheckins((list) => list.filter((c) => c.id !== id));
      await apiDelete<{ ok: boolean }>(`/api/checkins?id=${id}`);
      emitDataEvent({ type: 'checkins', day: recordDay });
    },
    [day]
  );

  return { checkins, loading, addCheckin, patchCheckin, removeCheckin, refresh: load };
}

/** 一个日期区间内的记录；今日页用它拉「接下来的安排」 */
export function useCheckinRange(from: string, to: string) {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await apiGet<{ checkins?: Checkin[] }>(
      `/api/checkins?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    if (Array.isArray(data?.checkins)) setCheckins(data.checkins);
    setLoading(false);
  }, [from, to]);

  // 与 Web 相同：把首次拉取推迟到渲染之后，避免在 effect 体内同步 setState
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  useAuthTokenEvents(() => void load());

  useDataEvents((event) => {
    if (event.type === 'checkins') void load();
  });

  return { checkins, loading, refresh: load };
}

/* ------------------------------------------------------------------ */
/* 统计                                                                */
/* ------------------------------------------------------------------ */
/** 连续天数 / 28 天热力图 / 总计 —— 全部来自服务端的真实聚合 */
export function useStats() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await apiGet<Stats>('/api/stats');
    if (data?.days) setStats(data);
    setLoading(false);
  }, []);

  // 与 Web 相同：把首次拉取推迟到渲染之后，避免在 effect 体内同步 setState
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  useAuthTokenEvents(() => void load());

  useDataEvents((event) => {
    if (event.type === 'checkins' || event.type === 'recipes') void load();
  });

  return { stats, loading, refresh: load };
}

/* ------------------------------------------------------------------ */
/* 分类 / 标签管理                                                       */
/* ------------------------------------------------------------------ */
export type TaxonomyResult = { ok: boolean; error?: string };

/** 分类与标签由用户自行维护，改名会同步到所有引用它的菜谱 */
export function useTaxonomies() {
  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [tags, setTags] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const apply = useCallback(
    (data: { categories?: TaxonomyItem[]; tags?: TaxonomyItem[] } | null) => {
      if (!data) return;
      if (Array.isArray(data.categories)) setCategories(data.categories);
      if (Array.isArray(data.tags)) setTags(data.tags);
    },
    []
  );

  const load = useCallback(async () => {
    const data = await apiGet<{ categories?: TaxonomyItem[]; tags?: TaxonomyItem[] }>(
      '/api/taxonomies'
    );
    apply(data);
    setLoading(false);
  }, [apply]);

  // 与 Web 相同：把首次拉取推迟到渲染之后，避免在 effect 体内同步 setState
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  useAuthTokenEvents(() => void load());

  useDataEvents((event) => {
    if (event.type === 'taxonomies' || event.type === 'recipes') void load();
  });

  /** 统一处理写请求：成功时刷新列表，失败时把服务端文案交给调用方展示 */
  const mutate = useCallback(
    async (path: string, init: RequestInit): Promise<TaxonomyResult> => {
      const res = await apiSend<{ categories?: TaxonomyItem[]; tags?: TaxonomyItem[] }>(path, init);
      if (!res.ok) return { ok: false, error: res.error };
      apply(res.data);
      emitDataEvent({ type: 'recipes' });
      emitDataEvent({ type: 'taxonomies' });
      return { ok: true };
    },
    [apply]
  );

  const addTaxonomy = useCallback(
    (kind: TaxonomyKind, name: string) =>
      mutate('/api/taxonomies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, name }),
      }),
    [mutate]
  );

  const renameTaxonomy = useCallback(
    (id: number, name: string) =>
      mutate('/api/taxonomies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      }),
    [mutate]
  );

  const removeTaxonomy = useCallback(
    (id: number) => mutate(`/api/taxonomies?id=${id}`, { method: 'DELETE' }),
    [mutate]
  );

  return {
    categories,
    tags,
    loading,
    refresh: load,
    addTaxonomy,
    renameTaxonomy,
    removeTaxonomy,
  };
}

/* ------------------------------------------------------------------ */
/* 单道菜谱的历史                                                        */
/* ------------------------------------------------------------------ */
/** 详情页的「做过的记录」与「历次笔记」 */
export function useRecipeHistory(slug: string | undefined) {
  const [data, setData] = useState<RecipeHistory>(EMPTY_HISTORY);
  const [loading, setLoading] = useState(Boolean(slug));

  const load = useCallback(async () => {
    if (!slug) {
      setData(EMPTY_HISTORY);
      setLoading(false);
      return;
    }
    const res = await apiGet<RecipeHistory>(`/api/recipes/${encodeURIComponent(slug)}/history`);
    setData(res ?? EMPTY_HISTORY);
    setLoading(false);
  }, [slug]);

  // 与 Web 相同：把首次拉取推迟到渲染之后，避免在 effect 体内同步 setState
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  useAuthTokenEvents(() => void load());

  useDataEvents((event) => {
    if (event.type === 'checkins') void load();
  });

  return { ...data, loading, refresh: load };
}
