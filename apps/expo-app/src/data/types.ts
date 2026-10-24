/**
 * daily + · 数据契约
 * ------------------------------------------------------------------
 * 与 Supabase 表一一对应。统计（连续天数 / 热力图 / 总计）由客户端
 * 按原始记录现算；「做过几次 / 上次做于」写入时同步到菜谱行。
 */

export type SessionUser = { id: string; email: string; name: string };

export type Recipe = {
  id?: number;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  minutes: number;
  /** 兼容字段：人份已从界面移除（不做换算），服务端仍返回，原样透传 */
  servings: number;
  image: string;
  favorite: boolean;
  cooked: number;
  lastCookedOn?: string | null;
  tags: string[];
  ingredients: { group: string; items: { name: string; amount: string }[] }[];
  steps: string[];
};

export type Checkin = {
  id: number;
  day: string;
  /** 兼容字段：餐次已从界面移除，服务端契约仍带；客户端不再读也不再让用户选 */
  meal: string;
  title: string;
  recipeSlug: string | null;
  /** 兼容字段：份量同上，写入时由数据层补默认值 */
  portion: string;
  time: string;
  note: string;
  /** 照片打卡的 Storage 路径；null = 菜谱或手输打卡 */
  photoPath: string | null;
  /** true = 未来的用餐计划，尚未确认吃到 */
  planned: boolean;
};

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

export type TaxonomyKind = 'category' | 'tag';
export type TaxonomyItem = { id: number; name: string; count: number };

export type RecipeHistory = {
  cooked: number;
  lastCookedOn: string | null;
  history: Checkin[];
  planned: Checkin[];
};

export const EMPTY_STATS: Stats = {
  streak: 0,
  days: [],
  totals: { recipes: 0, favorites: 0, checkins: 0, activeDays: 0, planned: 0 },
};

export const EMPTY_HISTORY: RecipeHistory = {
  cooked: 0,
  lastCookedOn: null,
  history: [],
  planned: [],
};
