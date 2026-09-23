/**
 * 登录后的回跳地址：只允许站内相对路径，杜绝开放重定向；
 * 登录 / 注册页本身不作为回跳目标，避免来回跳转。
 */
export function safeNext(value: unknown, fallback = "/today"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  if (value.startsWith("/login") || value.startsWith("/register")) return fallback;
  return value;
}
