/**
 * daily + · 餐次推断 (純函數)
 * ------------------------------------------------------------------
 * 与 Web 的 CheckinProvider.smartMeal 同一套规则：随吃随记，先替用户猜一个，
 * 界面上仍然可以改。
 */

export const INTAKE_TAGS = ['正餐', '加餐', '轻食', '下午茶', '夜宵'] as const;

export const PORTIONS = [
  { value: '0.5', label: '½ 份' },
  { value: '1', label: '1 份' },
  { value: '1.5', label: '1.5 份' },
] as const;

export function smartMeal(d: Date = new Date()): string {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 21 || h < 5) return '夜宵';
  if (h >= 14 && h < 17) return '加餐';
  if (h >= 6 && h < 10) return '轻食';
  return '正餐';
}

/** 把存下来的份量文案还原成 Segmented 的选中值 */
export function portionValueOf(portion: string | undefined): string {
  if (!portion) return '1';
  if (portion.startsWith('½') || portion.startsWith('0.5')) return '0.5';
  if (portion.startsWith('1.5')) return '1.5';
  return '1';
}
