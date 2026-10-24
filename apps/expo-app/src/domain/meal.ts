/**
 * 餐段：时间轴分簇与打卡弹层的餐段选择共用同一张表。
 * 早 / 午 / 晚是「主餐」——今日完成度环只数这三段；其余算加餐。
 */

export type MealKey = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

export type MealGroup = {
  key: MealKey;
  label: string;
  icon: 'sunrise' | 'sun' | 'clock' | 'moon' | 'moon-star';
  /** 区间 [from, to)，单位分钟；night 跨零点，靠 minutesInMeal 特判 */
  from: number;
  to: number;
  main: boolean;
};

/** 顺序即时间轴从早到晚的展示顺序 */
export const MEAL_GROUPS: readonly MealGroup[] = [
  { key: 'morning', label: '早上', icon: 'sunrise', from: 5 * 60, to: 11 * 60, main: true },
  { key: 'noon', label: '中午', icon: 'sun', from: 11 * 60, to: 15 * 60, main: true },
  { key: 'afternoon', label: '下午茶', icon: 'clock', from: 15 * 60, to: 18 * 60, main: false },
  { key: 'evening', label: '晚上', icon: 'moon', from: 18 * 60, to: 23 * 60, main: true },
  { key: 'night', label: '夜宵', icon: 'moon-star', from: 23 * 60, to: 29 * 60, main: false },
];

export function minutesOfTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

/** "HH:MM" 属于哪个餐段；夜宵跨零点，0–5 点归 night */
export function mealOfTime(time: string): MealGroup {
  const m = minutesOfTime(time);
  for (const g of MEAL_GROUPS) {
    if (g.key === 'night') {
      if (m >= g.from || m < 5 * 60) return g;
    } else if (m >= g.from && m < g.to) {
      return g;
    }
  }
  return MEAL_GROUPS[0];
}

/** 主餐段（早/午/晚）各有至少一条实做记录的段数 */
export function mainMealsDone(times: string[]): number {
  const seen = new Set(
    times
      .map(mealOfTime)
      .filter((g) => g.main)
      .map((g) => g.key)
  );
  return seen.size;
}

/**
 * 打卡弹层的四档选择。选段即把时间设为该段的代表时刻；
 * 夜里（23 点后、5 点前）选「加餐」保持当下时间，而不是跳到下午。
 */
export type ComposerSegment = 'morning' | 'noon' | 'evening' | 'snack';

export const COMPOSER_SEGMENTS: { value: ComposerSegment; label: string }[] = [
  { value: 'morning', label: '早上' },
  { value: 'noon', label: '中午' },
  { value: 'evening', label: '晚上' },
  { value: 'snack', label: '加餐' },
];

export function segmentOfTime(time: string): ComposerSegment {
  const g = mealOfTime(time);
  if (g.key === 'morning') return 'morning';
  if (g.key === 'noon') return 'noon';
  if (g.key === 'evening') return 'evening';
  return 'snack';
}

/** 每段的代表时刻；snack 在夜里返回 null，调用方用「现在」 */
export function segmentDefaultTime(segment: ComposerSegment, nowMinutes: number): string | null {
  switch (segment) {
    case 'morning':
      return '08:30';
    case 'noon':
      return '12:30';
    case 'evening':
      return '19:00';
    case 'snack':
      return nowMinutes >= 23 * 60 || nowMinutes < 5 * 60 ? null : '15:30';
  }
}
