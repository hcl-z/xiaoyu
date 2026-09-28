/**
 * daily + · 账号规则
 * ------------------------------------------------------------------
 * 与服务端 lib/auth.ts 的校验完全一致：界面上勾选的规则就是服务端真正生效的规则。
 * 校验文案是唯一需要两处保持同步的东西——共享包抽取后再合并。
 */

export const DEMO_EMAIL = 'demo@daily.plus';
export const NAME_MAX = 20;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email);
}

export type PasswordRule = { id: string; label: string; test: (value: string) => boolean };

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: '至少 8 个字符',
    test: (v) => v.length >= 8 && v.length <= 72,
  },
  {
    id: 'mix',
    label: '同时包含字母和数字',
    test: (v) => /[A-Za-z]/.test(v) && /\d/.test(v),
  },
];

export function passwordProblem(password: string): string | null {
  if (password.length < 8) return '密码至少 8 个字符';
  if (password.length > 72) return '密码不能超过 72 个字符';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return '密码需同时包含字母和数字';
  return null;
}
