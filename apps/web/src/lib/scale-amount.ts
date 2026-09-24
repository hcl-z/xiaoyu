/**
 * 食材用量按人份换算。
 *
 * amount 是自由文本（"400 g"、"3 个（约 450 g）"、"1 汤匙"、"½ 个"、"现磨"），
 * 所以策略是：把字符串里所有数字按比例缩放，其余原样保留。数不出来的（"现磨"、
 * "少许"）原样返回——宁可不动，也不要编一个假数字出来。
 */

/** 中文与西文分数字符 → 小数 */
const FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 0.25,
  "¾": 0.75,
  "⅕": 0.2,
  "⅖": 0.4,
  "⅗": 0.6,
  "⅘": 0.8,
  "⅙": 1 / 6,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

const FRACTION_CHARS = Object.keys(FRACTIONS).join("");
/** 匹配 "1/2"、"½"、"12.5"、"400" */
const NUMBER_RE = new RegExp(`\\d+\\s*/\\s*\\d+|[${FRACTION_CHARS}]|\\d+(?:\\.\\d+)?`, "g");

/**
 * 跟在数字后面的这些词说明它是比例或序号，而不是用量，不能缩放。
 * 例：「蛋液的 1.5 倍」、「80%」、「3 成熟」。
 */
const RATIO_SUFFIX_RE = /^\s*(?:倍|%|％|成熟|分熟)/;

/** 把常见分数写法还原成小数，方便乘法 */
function toNumber(token: string): number | null {
  const trimmed = token.trim();
  if (FRACTIONS[trimmed] !== undefined) return FRACTIONS[trimmed];
  if (trimmed.includes("/")) {
    const [a, b] = trimmed.split("/").map((p) => Number(p.trim()));
    return Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? a / b : null;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** 缩放后回到人读的样子：整数不带小数点，小数最多一位，½ 用符号 */
function format(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  // 半份用 ½ 更像菜谱的写法
  if (Math.abs(rounded - Math.floor(rounded) - 0.5) < 0.01) {
    const whole = Math.floor(rounded);
    return whole > 0 ? `${whole}½` : "½";
  }
  return String(Math.round(rounded * 10) / 10);
}

/**
 * 按 factor 缩放 amount 里的每个数字。
 * factor 为 1 时原样返回，避免无谓的格式化差异。
 */
export function scaleAmount(amount: string, factor: number): string {
  if (!amount || factor === 1 || !Number.isFinite(factor) || factor <= 0) return amount;
  return amount.replace(NUMBER_RE, (token, offset: number) => {
    // 比例说明（「…的 1.5 倍」）不随人份变
    if (RATIO_SUFFIX_RE.test(amount.slice(offset + token.length))) return token;
    const n = toNumber(token);
    return n === null ? token : format(n * factor);
  });
}

/** 这条 amount 里有没有可换算的数字；没有就不必给用户"已换算"的暗示 */
export function hasScalableAmount(amount: string): boolean {
  if (!amount) return false;
  NUMBER_RE.lastIndex = 0;
  return NUMBER_RE.test(amount);
}
