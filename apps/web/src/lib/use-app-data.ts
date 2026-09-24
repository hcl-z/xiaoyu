"use client";

import { useCallback, useEffect, useState } from "react";
import { todayISO, type RecipeSeed } from "./content";

export type Recipe = RecipeSeed & { id?: number; lastCookedOn?: string | null };
export type Checkin = {
  id: number;
  day: string;
  meal: string;
  title: string;
  recipeSlug: string | null;
  portion: string;
  time: string;
  note: string;
  /** 照片打卡的图 id；null = 菜谱或手输打卡 */
  photoId: number | null;
  /** true = 未来的用餐计划，尚未确认吃到 */
  planned: boolean;
};

/** Records created in this session, kept in memory so a route change never loses them. */
let sessionCheckins: Checkin[] = [];
let sessionRecipes: Recipe[] = [];

function mergeCheckins(day: string, fromServer: Checkin[]): Checkin[] {
  const ids = new Set(fromServer.map((c) => c.id));
  const extra = sessionCheckins.filter((c) => c.day === day && !ids.has(c.id));
  return [...extra, ...fromServer].sort((a, b) => a.time.localeCompare(b.time));
}

/** 4.5s guard so the design never waits on a cold database. */
function withTimeout<T>(p: Promise<T>, ms = 4500): Promise<T | null> {
  return Promise.race([
    p.catch(() => null),
    new Promise<null>((res) => setTimeout(() => res(null), ms)),
  ]);
}

/** 会话失效（401）时回到登录页，并带上当前位置，登录后可原路返回 */
function redirectToLogin() {
  const { pathname, search } = window.location;
  if (pathname.startsWith("/login")) return;
  window.location.assign(`/login?next=${encodeURIComponent(pathname + search)}`);
}

async function authedFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await window.fetch(input, init);
  if (res.status === 401) redirectToLogin();
  return res;
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"postgres" | "local">("postgres");

  const load = useCallback(async () => {
    const data = await withTimeout(
      authedFetch("/api/recipes").then((r) => r.json()) as Promise<{
        recipes?: Recipe[];
        fallback?: boolean;
      }>,
    );
    if (Array.isArray(data?.recipes)) {
      const slugs = new Set(data.recipes.map((r) => r.slug));
      setRecipes([...sessionRecipes.filter((r) => !slugs.has(r.slug)), ...data.recipes]);
      setSource("postgres");
    } else {
      setSource("local");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;
    const initial = window.setTimeout(() => void load(), 0);
    const onChanged = () => void load();
    window.addEventListener("daily:recipes-changed", onChanged);
    // 打卡会派生菜谱的「做过几次 / 上次做于」，必须跟着刷
    window.addEventListener("daily:checkins-changed", onChanged);
    const safety = window.setTimeout(() => alive && setLoading(false), 6000);
    return () => {
      alive = false;
      window.clearTimeout(initial);
      window.clearTimeout(safety);
      window.removeEventListener("daily:recipes-changed", onChanged);
      window.removeEventListener("daily:checkins-changed", onChanged);
    };
  }, [load]);

  const addRecipe = useCallback(async (draft: Recipe) => {
    sessionRecipes = [draft, ...sessionRecipes.filter((r) => r.slug !== draft.slug)];
    setRecipes((list) => [draft, ...list.filter((r) => r.slug !== draft.slug)]);
    const data = await withTimeout(
      authedFetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      }).then((r) => r.json()) as Promise<{ recipe?: Recipe }>,
    );
    if (data?.recipe) {
      sessionRecipes = sessionRecipes.filter((r) => r.slug !== draft.slug);
      setRecipes((list) =>
        list.map((r) => (r.slug === draft.slug ? (data.recipe as Recipe) : r)),
      );
    }
    window.dispatchEvent(new Event("daily:recipes-changed"));
    return data?.recipe ?? draft;
  }, []);

  const updateRecipe = useCallback(async (slug: string, draft: Recipe) => {
    const optimistic = { ...draft, slug };
    sessionRecipes = [
      optimistic,
      ...sessionRecipes.filter((r) => r.slug !== slug),
    ];
    setRecipes((list) => list.map((r) => (r.slug === slug ? optimistic : r)));
    const data = await withTimeout(
      authedFetch(`/api/recipes?slug=${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(optimistic),
      }).then((r) => r.json()) as Promise<{ recipe?: Recipe }>,
    );
    const saved = data?.recipe ?? optimistic;
    sessionRecipes = sessionRecipes.filter((r) => r.slug !== slug);
    setRecipes((list) => list.map((r) => (r.slug === slug ? saved : r)));
    window.dispatchEvent(new Event("daily:recipes-changed"));
    return saved;
  }, []);

  const deleteRecipe = useCallback(async (slug: string) => {
    sessionRecipes = sessionRecipes.filter((r) => r.slug !== slug);
    setRecipes((list) => list.filter((r) => r.slug !== slug));
    await withTimeout(
      authedFetch(`/api/recipes?slug=${encodeURIComponent(slug)}`, { method: "DELETE" }),
    );
    window.dispatchEvent(new Event("daily:recipes-changed"));
  }, []);

  return {
    recipes,
    loading,
    source,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    refresh: load,
  };
}

export type Stats = {
  streak: number;
  days: { day: string; count: number }[];
  totals: {
    recipes: number;
    favorites: number;
    checkins: number;
    activeDays: number;
    planned: number;
  };
};

const EMPTY_STATS: Stats = {
  streak: 0,
  days: [],
  totals: {
    recipes: 0,
    favorites: 0,
    checkins: 0,
    activeDays: 0,
    planned: 0,
  },
};

/** 连续天数 / 28 天热力图 / 总计 —— 全部来自数据库真实聚合 */
export function useStats() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await withTimeout(authedFetch("/api/stats").then((r) => r.json()) as Promise<Stats>);
    if (data?.days) setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const onChanged = () => void load();
    window.addEventListener("daily:checkins-changed", onChanged);
    window.addEventListener("daily:recipes-changed", onChanged);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("daily:checkins-changed", onChanged);
      window.removeEventListener("daily:recipes-changed", onChanged);
    };
  }, [load]);

  return { stats, loading, refresh: load };
}

/* ------------------------------------------------------------------ */
/* 分类 / 标签管理                                                      */
/* ------------------------------------------------------------------ */
export type TaxonomyKind = "category" | "tag";
export type TaxonomyItem = { id: number; name: string; count: number };
type TaxonomyResult = { ok: boolean; error?: string };

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
    [],
  );

  const load = useCallback(async () => {
    const data = await withTimeout(
      authedFetch("/api/taxonomies").then((r) => r.json()) as Promise<{
        categories?: TaxonomyItem[];
        tags?: TaxonomyItem[];
      }>,
    );
    apply(data);
    setLoading(false);
  }, [apply]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const onChanged = () => void load();
    window.addEventListener("daily:taxonomies-changed", onChanged);
    window.addEventListener("daily:recipes-changed", onChanged);
    const safety = window.setTimeout(() => setLoading(false), 6000);
    return () => {
      window.clearTimeout(initial);
      window.clearTimeout(safety);
      window.removeEventListener("daily:taxonomies-changed", onChanged);
      window.removeEventListener("daily:recipes-changed", onChanged);
    };
  }, [load]);

  /** 统一处理写请求：成功时刷新列表，失败时把服务端文案交给调用方展示 */
  const mutate = useCallback(
    async (url: string, init: RequestInit): Promise<TaxonomyResult> => {
      try {
        const res = await authedFetch(url, init);
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          return { ok: false, error: data?.error ?? "操作失败，请重试" };
        }
        apply(data);
        window.dispatchEvent(new Event("daily:recipes-changed"));
        return { ok: true };
      } catch {
        return { ok: false, error: "网络异常，请重试" };
      }
    },
    [apply],
  );

  const addTaxonomy = useCallback(
    (kind: TaxonomyKind, name: string) =>
      mutate("/api/taxonomies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, name }),
      }),
    [mutate],
  );

  const renameTaxonomy = useCallback(
    (id: number, name: string) =>
      mutate("/api/taxonomies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      }),
    [mutate],
  );

  const removeTaxonomy = useCallback(
    (id: number) => mutate(`/api/taxonomies?id=${id}`, { method: "DELETE" }),
    [mutate],
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

export function useCheckins(day = todayISO()) {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"postgres" | "local">("postgres");

  const load = useCallback(async () => {
    const data = await withTimeout(
      authedFetch(`/api/checkins?day=${encodeURIComponent(day)}`).then((r) => r.json()) as Promise<{
        checkins?: Checkin[];
        fallback?: boolean;
      }>,
    );
    if (Array.isArray(data?.checkins)) {
      setCheckins(mergeCheckins(day, data.checkins));
      setSource(data.fallback ? "local" : "postgres");
    } else {
      // 请求失败时不注入任何示例数据，只保留本次会话里刚写入的记录
      setCheckins(mergeCheckins(day, []));
      setSource("local");
    }
    setLoading(false);
  }, [day]);

  useEffect(() => {
    let alive = true;
    const initial = window.setTimeout(() => {
      setLoading(true);
      setCheckins([]);
      void load();
    }, 0);
    const onChanged = (event: Event) => {
      const changedDay = (event as CustomEvent<{ day?: string }>).detail?.day;
      if (!changedDay || changedDay === day) void load();
    };
    window.addEventListener("daily:checkins-changed", onChanged);
    const safety = window.setTimeout(() => alive && setLoading(false), 6000);
    return () => {
      alive = false;
      window.clearTimeout(initial);
      window.clearTimeout(safety);
      window.removeEventListener("daily:checkins-changed", onChanged);
    };
  }, [day, load]);

  const addCheckin = useCallback(
    async (draft: Omit<Checkin, "id" | "time" | "note" | "planned" | "photoId"> & {
      time?: string;
      note?: string;
      planned?: boolean;
      photoId?: number | null;
    }) => {
      const optimistic: Checkin = {
        id: Date.now(),
        time: draft.time ?? new Date().toTimeString().slice(0, 5),
        note: draft.note ?? "",
        planned: draft.planned ?? false,
        photoId: draft.photoId ?? null,
        ...draft,
      };
      sessionCheckins = [...sessionCheckins, optimistic];
      if (draft.day === day) {
        setCheckins((list) => [...list, optimistic]);
      }
      const data = await withTimeout(
        authedFetch("/api/checkins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(optimistic),
        }).then((r) => r.json()) as Promise<{ checkin?: Checkin }>,
      );
      if (data?.checkin) {
        sessionCheckins = sessionCheckins.filter((c) => c.id !== optimistic.id);
        if (draft.day === day) {
          setCheckins((list) =>
            list.map((c) => (c.id === optimistic.id ? (data.checkin as Checkin) : c)),
          );
        }
      }
      window.dispatchEvent(
        new CustomEvent("daily:checkins-changed", { detail: { day: draft.day } }),
      );
      return data?.checkin ?? optimistic;
    },
    [day],
  );

  /** 就地修改一条记录；也用于把计划（planned）确认为已吃 */
  const patchCheckin = useCallback(
    async (id: number, patch: Partial<Omit<Checkin, "id">>, recordDay = day) => {
      sessionCheckins = sessionCheckins.map((c) => (c.id === id ? { ...c, ...patch } : c));
      if (recordDay === day) {
        setCheckins((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      }
      const data = await withTimeout(
        authedFetch(`/api/checkins?id=${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }).then((r) => r.json()) as Promise<{ checkin?: Checkin }>,
      );
      if (data?.checkin) {
        const saved = data.checkin;
        sessionCheckins = sessionCheckins.filter((c) => c.id !== id);
        if (recordDay === day) {
          setCheckins((list) => list.map((c) => (c.id === id ? saved : c)));
        }
      }
      window.dispatchEvent(
        new CustomEvent("daily:checkins-changed", { detail: { day: patch.day ?? recordDay } }),
      );
      return data?.checkin;
    },
    [day],
  );

  /** 删除一条记录（用于覆盖同一餐次的旧记录） */
  const removeCheckin = useCallback(async (id: number, recordDay = day) => {
    sessionCheckins = sessionCheckins.filter((c) => c.id !== id);
    if (recordDay === day) {
      setCheckins((list) => list.filter((c) => c.id !== id));
    }
    await withTimeout(authedFetch(`/api/checkins?id=${id}`, { method: "DELETE" }));
    window.dispatchEvent(
      new CustomEvent("daily:checkins-changed", { detail: { day: recordDay } }),
    );
  }, [day]);

  return { checkins, loading, source, addCheckin, patchCheckin, removeCheckin, refresh: load };
}

/* ------------------------------------------------------------------ */
/* 日期区间 / 全量历史 / 单菜谱历史                                */
/* ------------------------------------------------------------------ */

/** 一个日期区间内的记录，今日页用它拉「接下来的计划」 */
export function useCheckinRange(from: string, to: string) {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await withTimeout(
      authedFetch(
        `/api/checkins?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ).then((r) => r.json()) as Promise<{ checkins?: Checkin[] }>,
    );
    if (Array.isArray(data?.checkins)) setCheckins(data.checkins);
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const onChanged = () => void load();
    window.addEventListener("daily:checkins-changed", onChanged);
    const safety = window.setTimeout(() => setLoading(false), 6000);
    return () => {
      window.clearTimeout(initial);
      window.clearTimeout(safety);
      window.removeEventListener("daily:checkins-changed", onChanged);
    };
  }, [load]);

  return { checkins, loading, refresh: load };
}

export type RecipeHistory = {
  cooked: number;
  lastCookedOn: string | null;
  history: Checkin[];
  planned: Checkin[];
};

const EMPTY_HISTORY: RecipeHistory = {
  cooked: 0,
  lastCookedOn: null,
  history: [],
  planned: [],
};

/** 单道菜谱的打卡历史：详情页的「做过的记录」与「历次笔记」 */
export function useRecipeHistory(slug: string | undefined) {
  const [data, setData] = useState<RecipeHistory>(EMPTY_HISTORY);
  const [loading, setLoading] = useState(Boolean(slug));

  const load = useCallback(async () => {
    if (!slug) {
      setData(EMPTY_HISTORY);
      setLoading(false);
      return;
    }
    const res = await withTimeout(
      authedFetch(`/api/recipes/${encodeURIComponent(slug)}/history`).then((r) =>
        r.ok ? (r.json() as Promise<RecipeHistory>) : null,
      ),
    );
    setData(res ?? EMPTY_HISTORY);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const onChanged = () => void load();
    window.addEventListener("daily:checkins-changed", onChanged);
    const safety = window.setTimeout(() => setLoading(false), 6000);
    return () => {
      window.clearTimeout(initial);
      window.clearTimeout(safety);
      window.removeEventListener("daily:checkins-changed", onChanged);
    };
  }, [load]);

  return { ...data, loading, refresh: load };
}
