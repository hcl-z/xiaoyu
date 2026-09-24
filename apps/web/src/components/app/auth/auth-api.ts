export type AuthAction = "login" | "register" | "demo" | "logout";
export type AuthResult = { ok: true } | { ok: false; error: string };

/** 认证请求的统一出口：失败时把服务端的中文提示原样交给界面展示 */
export async function postAuth(
  action: AuthAction,
  body?: Record<string, unknown>,
): Promise<AuthResult> {
  try {
    const res = await fetch(`/api/auth/${action}`, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: data?.error ?? "操作失败，请稍后再试" };
  } catch {
    return { ok: false, error: "网络异常，请检查网络后重试" };
  }
}

/**
 * 认证成功后进入应用：先确认 Cookie 真的落地（浏览器可能禁用 Cookie，
 * 或响应头因协议不匹配被丢弃），确认后再整页跳转，避免与登录页来回弹。
 * 用 replace 而非 assign，返回键不会退回登录页。
 */
export async function finishAuth(next: string): Promise<boolean> {
  try {
    const me = await fetch("/api/auth/me", { cache: "no-store" });
    if (!me.ok) return false;
  } catch {
    return false;
  }
  window.location.replace(next);
  return true;
}
