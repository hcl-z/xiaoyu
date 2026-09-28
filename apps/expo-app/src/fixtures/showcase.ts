/**
 * daily + · SHOWCASE FIXTURES
 * ------------------------------------------------------------------
 * 确定性本地数据。Showcase 不依赖网络或后端，
 * 每次渲染都得到同一份示例，便于人工比对。
 */
import type { TabItem } from '@/chrome';

export const tabItems: TabItem[] = [
  { value: 'today', label: '今日', icon: 'calendar-check' },
  { value: 'recipes', label: '菜谱', icon: 'book-open' },
  { value: 'profile', label: '我的', icon: 'user-round' },
];

/** 本周节奏：周一 → 周日 */
export const weekBars = {
  values: [2, 3, 1, 3, 2, 0, 2],
  labels: ['一', '二', '三', '四', '五', '六', '日'],
};

/** 28 天热力图：固定的 0–3 分布 */
export const heatmap = {
  values: [1, 2, 3, 2, 1, 0, 1, 2, 3, 3, 2, 1, 2, 0, 3, 2, 1, 2, 3, 1, 2, 3, 0, 1, 2, 1, 3, 2],
  days: Array.from({ length: 28 }, (_, i) => `2026-08-${String(i + 1).padStart(2, '0')}`),
  selected: '2026-08-20',
};

export const mealStats = [
  { value: '21', label: '连续天数', tone: 'accent' as const },
  { value: '63', label: '本月餐数' },
  { value: '4.8', label: '平均评分' },
];

export const nutrition = [
  { label: '蛋白质', value: 32, max: 60, unit: 'g' },
  { label: '碳水', value: 78, max: 120, unit: 'g' },
  { label: '脂肪', value: 21, max: 50, unit: 'g' },
];

export const recipeRows = [
  { title: '番茄牛腩饭', subtitle: '12:40 · 1 份 · 午餐', value: '45 分钟' },
  { title: '清蒸鲈鱼', subtitle: '昨天 · 晚餐', value: '25 分钟' },
  { title: '鸡胸西兰花', subtitle: '3 天前 · 午餐', value: '18 分钟' },
];

export const taxonomyRows = [
  { title: '家常菜', subtitle: '24 个菜谱', value: '主分类' },
  { title: '快手菜', subtitle: '11 个菜谱', value: '标签' },
  { title: '汤羹', subtitle: '6 个菜谱', value: '标签' },
];

export const searchSuggestions = ['番茄', '牛腩', '清蒸', '鸡胸'];

export const iconSamples = [
  'book-open',
  'calendar-check',
  'calendar-clock',
  'chart-column',
  'check',
  'chevron-left',
  'chevron-right',
  'circle-alert',
  'clock',
  'heart',
  'notebook-pen',
  'pencil',
  'plus',
  'search',
  'tags',
  'trash-2',
  'user-round',
  'utensils-crossed',
] as const;
