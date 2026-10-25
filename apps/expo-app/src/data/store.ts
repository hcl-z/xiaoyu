/**
 * daily + · DATA LAYER
 * ------------------------------------------------------------------
 * 直连 Supabase：数据经 RLS 隔离，登录者只能触到自己的行；
 * user_id 由数据层显式写入（表上没有数据库默认值）。
 *
 * 统计（连续天数 / 28 天热力图 / 总计）在客户端按原始记录现算；
 * 「做过几次 / 上次做于」在打卡写入后同步回菜谱行——打卡是唯一事实源。
 *
 * 跨屏刷新沿用进程内事件总线（@/data/bus）：checkins / recipes /
 * taxonomies / auth（登录登出）。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { shiftDay, todayISO } from '@/domain/date';

import { supabase } from './supabase';
import { emitDataEvent, subscribeData, type DataEvent } from './bus';
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
/** 分类与标签的会话缓存：我的页已经拉过，点进管理页时直接可用，弹层不再闪白 */
type TaxonomyRow = { id: number; kind: string; name: string; sort_order: number };
let sessionTaxonomies: TaxonomyRow[] = [];
/** 统计与单菜谱历史的会话缓存：跨页跳转时先给上一份真实数据，后台再刷新 */
let sessionStats: Stats | null = null;
const sessionHistories = new Map<string, RecipeHistory>();
let sessionRange: { key: string; checkins: Checkin[] } | null = null;

/** 兼容列：餐次与份量已从界面移除，表里仍保留，写入时补默认值 */
const LEGACY_MEAL = '正餐';
const LEGACY_PORTION = '1 份';

/** 退出登录时必须清空，下一位登录者不能看到上一位的数据 */
export function resetDataCaches() {
  sessionCheckins = [];
  sessionRecipes = [];
  sessionTaxonomies = [];
  sessionStats = null;
  sessionHistories.clear();
  sessionRange = null;
  emitDataEvent({ type: 'auth' });
}

async function requireUid(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) throw new Error('登录状态失效，请重新登录');
  return uid;
}

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === '23505') return '同名的内容已存在';
  return error.message || '操作失败，请稍后再试';
}

function useDataEvents(handler: (event: DataEvent) => void) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => subscribeData((event) => ref.current(event)), []);
}

/* ------------------------------------------------------------------ */
/* 行 <-> 对象 映射（表列是 snake_case）                                  */
/* ------------------------------------------------------------------ */

type CheckinRow = {
  id: number;
  day: string;
  meal: string;
  title: string;
  recipe_slug: string | null;
  portion: string;
  time: string;
  note: string;
  photo_path: string | null;
  planned: boolean;
};

function toCheckin(row: CheckinRow): Checkin {
  return {
    id: row.id,
    day: row.day,
    meal: row.meal,
    title: row.title,
    recipeSlug: row.recipe_slug,
    portion: row.portion,
    time: row.time,
    note: row.note,
    photoPath: row.photo_path,
    planned: row.planned,
  };
}

function checkinColumns(record: Omit<Checkin, 'id'>) {
  return {
    day: record.day,
    meal: record.meal,
    title: record.title,
    recipe_slug: record.recipeSlug,
    portion: record.portion,
    time: record.time,
    note: record.note,
    photo_path: record.photoPath,
    planned: record.planned,
  };
}

type RecipeRow = {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  minutes: number | null;
  servings: number | null;
  image: string | null;
  favorite: boolean | null;
  cooked: number | null;
  last_cooked_on: string | null;
  tags: string[] | null;
  ingredients: Recipe['ingredients'] | null;
  steps: string[] | null;
};

function toRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? '',
    category: row.category ?? '主食',
    minutes: row.minutes ?? 20,
    servings: row.servings ?? 2,
    image: row.image ?? '',
    favorite: Boolean(row.favorite),
    cooked: row.cooked ?? 0,
    lastCookedOn: row.last_cooked_on,
    tags: row.tags ?? [],
    ingredients: row.ingredients ?? [],
    steps: row.steps ?? [],
  };
}

function recipeColumns(draft: Recipe) {
  return {
    slug: draft.slug,
    title: draft.title,
    subtitle: draft.subtitle,
    category: draft.category,
    minutes: draft.minutes,
    servings: draft.servings,
    image: draft.image,
    favorite: draft.favorite,
    tags: draft.tags,
    ingredients: draft.ingredients,
    steps: draft.steps,
  };
}

/* ------------------------------------------------------------------ */
/* 打卡写入后同步菜谱的「做过几次 / 上次做于」                            */
/* ------------------------------------------------------------------ */

async function syncRecipeCookStats(uid: string, slugs: (string | null | undefined)[]) {
  const unique = [...new Set(slugs.filter((s): s is string => Boolean(s)))];
  if (unique.length === 0) return;
  for (const slug of unique) {
    const { data, error } = await supabase
      .from('checkins')
      .select('day')
      .eq('user_id', uid)
      .eq('recipe_slug', slug)
      .eq('planned', false);
    if (error || !data) continue;
    await supabase
      .from('recipes')
      .update({
        cooked: data.length,
        last_cooked_on:
          data
            .map((r) => r.day)
            .sort()
            .at(-1) ?? null,
      })
      .eq('user_id', uid)
      .eq('slug', slug);
  }
}

/* ------------------------------------------------------------------ */
/* 菜谱                                                                */
/* ------------------------------------------------------------------ */

export type RecipeSave = { recipe: Recipe; error?: string };

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('recipes').select('*').order('id');
    if (!error && data) {
      const rows = data.map(toRecipe);
      const slugs = new Set(rows.map((r) => r.slug));
      setRecipes([...sessionRecipes.filter((r) => !slugs.has(r.slug)), ...rows]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  useDataEvents((event) => {
    if (event.type === 'recipes' || event.type === 'checkins' || event.type === 'auth') {
      void load();
    }
  });

  const addRecipe = useCallback(async (draft: Recipe): Promise<RecipeSave> => {
    sessionRecipes = [draft, ...sessionRecipes.filter((r) => r.slug !== draft.slug)];
    setRecipes((list) => [draft, ...list.filter((r) => r.slug !== draft.slug)]);
    try {
      const uid = await requireUid();
      const { data, error } = await supabase
        .from('recipes')
        .insert({ ...recipeColumns(draft), user_id: uid })
        .select('*')
        .single();
      if (error) throw error;
      const saved = toRecipe(data);
      sessionRecipes = sessionRecipes.filter((r) => r.slug !== draft.slug);
      setRecipes((list) => list.map((r) => (r.slug === draft.slug ? saved : r)));
      emitDataEvent({ type: 'recipes' });
      return { recipe: saved };
    } catch (e) {
      emitDataEvent({ type: 'recipes' });
      return {
        recipe: draft,
        error: e instanceof Error ? friendlyError({ message: e.message }) : '保存失败，请重试',
      };
    }
  }, []);

  const updateRecipe = useCallback(async (slug: string, draft: Recipe): Promise<RecipeSave> => {
    const optimistic: Recipe = { ...draft, slug };
    sessionRecipes = [optimistic, ...sessionRecipes.filter((r) => r.slug !== slug)];
    setRecipes((list) => list.map((r) => (r.slug === slug ? optimistic : r)));
    try {
      const uid = await requireUid();
      const { data, error } = await supabase
        .from('recipes')
        .update(recipeColumns(optimistic))
        .eq('user_id', uid)
        .eq('slug', slug)
        .select('*')
        .single();
      const saved = error || !data ? optimistic : toRecipe(data);
      sessionRecipes = sessionRecipes.filter((r) => r.slug !== slug);
      setRecipes((list) => list.map((r) => (r.slug === slug ? saved : r)));
      emitDataEvent({ type: 'recipes' });
      return { recipe: saved, error: error ? friendlyError(error) : undefined };
    } catch (e) {
      return { recipe: optimistic, error: e instanceof Error ? e.message : '保存失败，请重试' };
    }
  }, []);

  const deleteRecipe = useCallback(async (slug: string) => {
    sessionRecipes = sessionRecipes.filter((r) => r.slug !== slug);
    setRecipes((list) => list.filter((r) => r.slug !== slug));
    const uid = await requireUid().catch(() => null);
    if (uid) {
      await supabase.from('recipes').delete().eq('user_id', uid).eq('slug', slug);
    }
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
    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('day', day)
      .order('time')
      .order('id');
    const rows = !error && data ? data.map(toCheckin) : [];
    const ids = new Set(rows.map((c) => c.id));
    const extra = sessionCheckins.filter((c) => c.day === day && !ids.has(c.id));
    setCheckins([...extra, ...rows].sort((a, b) => (a.time || '').localeCompare(b.time || '')));
    setLoading(false);
  }, [day]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setCheckins([]);
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [day, load]);

  useDataEvents((event) => {
    if (event.type === 'auth') void load();
    if (event.type === 'checkins' && (!event.day || event.day === day)) void load();
  });

  const addCheckin = useCallback(
    async (
      draft: Omit<
        Checkin,
        'id' | 'time' | 'note' | 'planned' | 'photoPath' | 'meal' | 'portion'
      > & { time?: string; note?: string; planned?: boolean; photoPath?: string | null }
    ) => {
      const optimistic: Checkin = {
        id: Date.now(),
        time: draft.time ?? new Date().toTimeString().slice(0, 5),
        note: draft.note ?? '',
        planned: draft.planned ?? false,
        photoPath: draft.photoPath ?? null,
        meal: LEGACY_MEAL,
        portion: LEGACY_PORTION,
        ...draft,
      };
      sessionCheckins = [...sessionCheckins, optimistic];
      if (draft.day === day) setCheckins((list) => [...list, optimistic]);

      let saved: Checkin = optimistic;
      try {
        const uid = await requireUid();
        const { data, error } = await supabase
          .from('checkins')
          .insert({ ...checkinColumns(optimistic), user_id: uid })
          .select('*')
          .single();
        if (error) throw error;
        saved = toCheckin(data);
        sessionCheckins = sessionCheckins.filter((c) => c.id !== optimistic.id);
        sessionCheckins = [...sessionCheckins, saved];
      } catch {
        // 乐观值保留：界面照常显示这一条，错误由下一次拉取暴露
      }
      if (draft.day === day) {
        setCheckins((list) => list.map((c) => (c.id === optimistic.id ? saved : c)));
      }
      emitDataEvent({ type: 'checkins', day: draft.day });
      void (async () => {
        const uid = await requireUid().catch(() => null);
        if (uid) await syncRecipeCookStats(uid, [draft.recipeSlug]);
      })();
      return saved;
    },
    [day]
  );

  const patchCheckin = useCallback(
    async (id: number, patch: Partial<Omit<Checkin, 'id'>>, recordDay: string = day) => {
      sessionCheckins = sessionCheckins.map((c) => (c.id === id ? { ...c, ...patch } : c));
      if (recordDay === day) {
        setCheckins((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      }
      const { photoPath, photoId, recipeSlug, ...rest } = patch as Record<string, unknown> & {
        photoPath?: string | null;
        photoId?: number;
        recipeSlug?: string | null;
      };
      const columns: Record<string, unknown> = { ...rest };
      if ('photoPath' in patch) columns.photo_path = photoPath ?? null;
      if ('recipeSlug' in patch) columns.recipe_slug = recipeSlug ?? null;

      let saved: Checkin | undefined;
      try {
        const uid = await requireUid();
        const { data, error } = await supabase
          .from('checkins')
          .update(columns)
          .eq('user_id', uid)
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        saved = toCheckin(data);
        sessionCheckins = sessionCheckins.map((c) => (c.id === id ? saved! : c));
        if (recordDay === day) {
          setCheckins((list) => list.map((c) => (c.id === id ? saved! : c)));
        }
      } catch {
        // 保持乐观值
      }
      emitDataEvent({ type: 'checkins', day: patch.day ?? recordDay });
      void (async () => {
        const uid = await requireUid().catch(() => null);
        if (uid) await syncRecipeCookStats(uid, [recipeSlug ?? undefined]);
      })();
      return saved;
    },
    [day]
  );

  const removeCheckin = useCallback(
    async (id: number, recordDay: string = day) => {
      const target = sessionCheckins.find((c) => c.id === id);
      sessionCheckins = sessionCheckins.filter((c) => c.id !== id);
      if (recordDay === day) setCheckins((list) => list.filter((c) => c.id !== id));
      const uid = await requireUid().catch(() => null);
      if (uid) {
        await supabase.from('checkins').delete().eq('user_id', uid).eq('id', id);
        if (target?.recipeSlug) await syncRecipeCookStats(uid, [target.recipeSlug]);
        if (target?.photoPath) {
          const { removeImage } = await import('./photos');
          await removeImage(target.photoPath).catch(() => undefined);
        }
      }
      emitDataEvent({ type: 'checkins', day: recordDay });
    },
    [day]
  );

  return { checkins, loading, addCheckin, patchCheckin, removeCheckin, refresh: load };
}

/** 一个日期区间内的记录；今日页用它拉「接下来的安排」 */
export function useCheckinRange(from: string, to: string) {
  const key = `${from}|${to}`;
  const [checkins, setCheckins] = useState<Checkin[]>(
    sessionRange?.key === key ? sessionRange.checkins : []
  );
  const [loading, setLoading] = useState(sessionRange?.key !== key);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .gte('day', from)
      .lte('day', to)
      .order('day')
      .order('time')
      .order('id');
    if (!error && data) {
      const next = data.map(toCheckin);
      sessionRange = { key, checkins: next };
      setCheckins(next);
    }
    setLoading(false);
  }, [from, to, key]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  useDataEvents((event) => {
    if (event.type === 'checkins' || event.type === 'auth') void load();
  });

  return { checkins, loading, refresh: load };
}

/* ------------------------------------------------------------------ */
/* 统计（客户端按原始记录现算）                                           */
/* ------------------------------------------------------------------ */

/** 连续天数：从今天（今天还没记则从昨天）往前数 */
function streakFrom(active: Set<string>): number {
  let streak = 0;
  let cursor = todayISO();
  if (!active.has(cursor)) cursor = shiftDay(cursor, -1);
  for (let i = 0; i < 400; i += 1) {
    if (!active.has(cursor)) break;
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

const STATS_DAYS = 28;

export function useStats() {
  const [stats, setStats] = useState<Stats>(sessionStats ?? EMPTY_STATS);
  const [loading, setLoading] = useState(sessionStats === null);

  const load = useCallback(async () => {
    const today = todayISO();
    const [doneDaysRes, favoritesRes, plannedRes] = await Promise.all([
      supabase
        .from('checkins')
        .select('day')
        .eq('planned', false)
        .order('day', { ascending: false })
        .limit(2000),
      supabase.from('recipes').select('favorite'),
      supabase.from('checkins').select('id').eq('planned', true).gte('day', today),
    ]);

    const doneDays = doneDaysRes.data ?? [];
    const counts = new Map<string, number>();
    for (const row of doneDays) counts.set(row.day, (counts.get(row.day) ?? 0) + 1);
    const days = Array.from({ length: STATS_DAYS }, (_, i) => {
      const day = shiftDay(today, -(STATS_DAYS - 1 - i));
      return { day, count: counts.get(day) ?? 0 };
    });
    const recipesRows = favoritesRes.data ?? [];

    const next: Stats = {
      streak: streakFrom(new Set(doneDays.map((r) => r.day))),
      days,
      totals: {
        recipes: recipesRows.length,
        favorites: recipesRows.filter((r) => r.favorite).length,
        checkins: doneDays.length,
        activeDays: days.filter((d) => d.count > 0).length,
        planned: plannedRes.data?.length ?? 0,
      },
    };
    sessionStats = next;
    setStats(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  useDataEvents((event) => {
    if (event.type === 'checkins' || event.type === 'recipes' || event.type === 'auth') {
      void load();
    }
  });

  return { stats, loading, refresh: load };
}

/* ------------------------------------------------------------------ */
/* 分类 / 标签管理                                                       */
/* ------------------------------------------------------------------ */

export type TaxonomyResult = { ok: boolean; error?: string };

export function useTaxonomies() {
  const { recipes } = useRecipes();
  const [rows, setRows] = useState<TaxonomyRow[]>(sessionTaxonomies);
  const [loading, setLoading] = useState(sessionTaxonomies.length === 0);

  const load = useCallback(async () => {
    const uid = await supabase.auth.getSession().then(({ data }) => data.session?.user.id);
    if (!uid) {
      sessionTaxonomies = [];
      setRows([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('taxonomies')
      .select('*')
      .eq('user_id', uid)
      .order('kind')
      .order('sort_order')
      .order('id');
    if (error || !data) {
      setLoading(false);
      return;
    }
    const next = data.map((row) => ({
      id: row.id,
      kind: row.kind,
      name: row.name,
      sort_order: row.sort_order,
    }));
    sessionTaxonomies = next;
    setRows(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  useDataEvents((event) => {
    if (event.type === 'taxonomies' || event.type === 'auth') void load();
  });

  /** 引用计数渲染时现算：菜谱数据后到也能立即反映，load 不必跟着 recipes 重跑 */
  const catCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of recipes) m.set(r.category, (m.get(r.category) ?? 0) + 1);
    return m;
  }, [recipes]);
  const tagCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of recipes) for (const t of r.tags) m.set(t, (m.get(t) ?? 0) + 1);
    return m;
  }, [recipes]);

  const categories: TaxonomyItem[] = useMemo(
    () =>
      rows
        .filter((r) => r.kind === 'category')
        .map((r) => ({ id: r.id, name: r.name, count: catCount.get(r.name) ?? 0 })),
    [rows, catCount]
  );
  const tags: TaxonomyItem[] = useMemo(
    () =>
      rows
        .filter((r) => r.kind === 'tag')
        .map((r) => ({ id: r.id, name: r.name, count: tagCount.get(r.name) ?? 0 })),
    [rows, tagCount]
  );

  const mutate = useCallback(async (run: () => Promise<void>): Promise<TaxonomyResult> => {
    try {
      await run();
      emitDataEvent({ type: 'taxonomies' });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : '操作失败，请重试' };
    }
  }, []);

  const addTaxonomy = useCallback(
    (kind: TaxonomyKind, name: string) =>
      mutate(async () => {
        const uid = await requireUid();
        const { error } = await supabase
          .from('taxonomies')
          .insert({ user_id: uid, kind, name, sort_order: 0 });
        if (error) throw new Error(friendlyError(error));
      }),
    [mutate]
  );

  const renameTaxonomy = useCallback(
    (id: number, nextName: string) =>
      mutate(async () => {
        const uid = await requireUid();
        // 先读旧行拿旧名与类型，改名后把引用它的菜谱一并同步
        const { data: before, error: readError } = await supabase
          .from('taxonomies')
          .select('kind, name')
          .eq('user_id', uid)
          .eq('id', id)
          .single();
        if (readError || !before) throw new Error('没有找到这一项');
        const { error: updateError } = await supabase
          .from('taxonomies')
          .update({ name: nextName })
          .eq('user_id', uid)
          .eq('id', id);
        if (updateError) throw new Error(friendlyError(updateError));
        if (before.name === nextName) return;
        if (before.kind === 'category') {
          await supabase
            .from('recipes')
            .update({ category: nextName })
            .eq('user_id', uid)
            .eq('category', before.name);
        } else {
          const { data: list } = await supabase
            .from('recipes')
            .select('id, tags')
            .eq('user_id', uid)
            .contains('tags', [before.name]);
          for (const row of list ?? []) {
            const list2 = (row.tags ?? []).map((t: string) => (t === before.name ? nextName : t));
            await supabase.from('recipes').update({ tags: list2 }).eq('id', row.id);
          }
        }
        emitDataEvent({ type: 'recipes' });
      }),
    [mutate]
  );

  const removeTaxonomy = useCallback(
    (id: number) =>
      mutate(async () => {
        const uid = await requireUid();
        const { error } = await supabase
          .from('taxonomies')
          .delete()
          .eq('user_id', uid)
          .eq('id', id);
        if (error) throw new Error(friendlyError(error));
      }),
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

export function useRecipeHistory(slug: string | undefined) {
  const [data, setData] = useState<RecipeHistory>(
    (slug && sessionHistories.get(slug)) || EMPTY_HISTORY
  );
  const [loading, setLoading] = useState(Boolean(slug) && !sessionHistories.has(slug ?? ''));

  const load = useCallback(async () => {
    if (!slug) {
      setData(EMPTY_HISTORY);
      setLoading(false);
      return;
    }
    const { data: rows, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('recipe_slug', slug)
      .order('day', { ascending: false })
      .order('time');
    if (error || !rows) {
      setData(EMPTY_HISTORY);
      setLoading(false);
      return;
    }
    const all = rows.map(toCheckin);
    const history = all.filter((c) => !c.planned);
    const planned = all.filter((c) => c.planned);
    const next: RecipeHistory = {
      cooked: history.length,
      lastCookedOn: history[0]?.day ?? null,
      history,
      planned,
    };
    sessionHistories.set(slug, next);
    setData(next);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  useDataEvents((event) => {
    if (event.type === 'checkins' || event.type === 'auth') void load();
  });

  return { ...data, loading, refresh: load };
}
