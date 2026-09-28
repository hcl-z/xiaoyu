/**
 * daily + · DATE HELPERS (純函數)
 * ------------------------------------------------------------------
 * 与 Web 的 lib/content.ts 同一套语义：day 一律是 YYYY-MM-DD 的本地日期串，
 * 「今天」以设备时钟为准。所有换算都按本地 12:00 取基准，
 * 避开夏令时切换导致的跨日偏移。
 */

export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;

export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 由年月日直接构造本地正午，避免各引擎对 ISO 串解析的差异 */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export function toISO(d: Date): string {
  return todayISO(d);
}

export function shiftDay(day: string, delta: number): string {
  const d = parseDay(day);
  d.setDate(d.getDate() + delta);
  return toISO(d);
}

/** 两个 day 之间相差的天数（later - earlier） */
export function daysBetween(earlier: string, later: string): number {
  const a = parseDay(earlier).getTime();
  const b = parseDay(later).getTime();
  return Math.round((b - a) / 86400000);
}

/** 那一周的周一（周一为一周之始） */
export function startOfWeek(day: string): string {
  const d = parseDay(day);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return toISO(d);
}

/** 以 day 所在周的周一为起点，取 7 天 */
export function weekOf(day: string): string[] {
  const monday = startOfWeek(day);
  return Array.from({ length: 7 }, (_, i) => shiftDay(monday, i));
}

/** "9 月 23 日 · 星期三" */
export function dayLabel(day: string): string {
  const d = parseDay(day);
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 · 星期${WEEKDAYS[d.getDay()]}`;
}

/** "9月23日" —— 弹层副标题用的紧凑写法 */
export function monthDayLabel(day: string): string {
  const d = parseDay(day);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** "2026 年 9 月 23 日 · 星期三" —— 照片打卡顶部的日期行 */
export function fullDateLine(day: string): string {
  const d = parseDay(day);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 · 星期${WEEKDAYS[d.getDay()]}`;
}

/** 把「多少天前」转成人读的相对描述，给菜谱的「上次做于」用 */
export function relativeDayLabel(day: string | null | undefined, from: Date = new Date()): string {
  if (!day) return '还没做过';
  const diff = daysBetween(day, todayISO(from));
  if (diff < 0) return '已安排';
  if (diff === 0) return '今天做过';
  if (diff === 1) return '昨天做过';
  if (diff < 7) return `${diff} 天前做过`;
  if (diff < 30) return `${Math.floor(diff / 7)} 周前做过`;
  if (diff < 365) return `${Math.floor(diff / 30)} 个月前做过`;
  return '很久之前做过';
}
