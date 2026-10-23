/**
 * daily + · API CLIENT
 * ------------------------------------------------------------------
 * 原生端不依赖 Cookie：会话令牌存在设备钥匙串里，每次请求带 Authorization。
 * 同时固定带一枚 x-daily-client: native，让服务端知道该把令牌一并回给客户端。
 *
 * 两条读取路径，与 Web 的 authedFetch + withTimeout 对齐：
 *   apiGet   —— 读；失败或超时回 null，界面走空态而不是卡在转圈
 *   apiSend  —— 写；失败时把服务端的中文文案原样交给调用方展示
 */

import Constants from 'expo-constants';

/**
 * 开发时后端跑在开发机上，而「开发机」对模拟器是 localhost、
 * 对真机是局域网 IP。Metro 已经知道自己在哪个地址上被访问，
 * 沿用同一个主机名即可，不必让每个人手填 IP。
 */
function devBaseUrl(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (typeof Constants.experienceUrl === 'string'
      ? Constants.experienceUrl.replace(/^[a-z]+:\/\//, '')
      : undefined);
  const host = hostUri?.split('/')[0]?.split(':')[0];
  return host ? `http://${host}:3000` : null;
}

const DEFAULT_BASE_URL = devBaseUrl() ?? 'http://localhost:3000';

/** 正式环境用 EXPO_PUBLIC_API_BASE_URL 指定，开发环境沿用 Metro 的主机 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL).replace(
  /\/+$/,
  ''
);

/**
 * 运行时可切换的服务器地址（我的 › 服务器地址）。
 * 家庭部署的后端 IP 会随路由器变化，编译期写死一个地址撑不住真实使用，
 * 所以允许装机后在界面上改；为空时回落到上面的默认值。
 */
let runtimeBaseUrl: string | null = null;

/** 设置运行时服务器地址；返回生效地址（输入不合法时返回 null 且不改动） */
export function setApiBaseUrl(input: string | null): string | null {
  if (input === null) {
    runtimeBaseUrl = null;
    return getApiBaseUrl();
  }
  const normalized = input.trim().replace(/\/+$/, '');
  if (!/^https?:\/\/.+\..+/.test(normalized) && !/^https?:\/\/[^.]+(:\d+)?$/.test(normalized)) {
    return null;
  }
  runtimeBaseUrl = normalized;
  return normalized;
}

/** 当前生效的 API 根地址：运行时设置优先，其次编译期默认值 */
export function getApiBaseUrl(): string {
  return runtimeBaseUrl ?? API_BASE_URL;
}

/** 设计约定：网络等待超过这个时间就不再让界面等下去 */
const READ_TIMEOUT_MS = 4500;
const WRITE_TIMEOUT_MS = 12000;

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
const tokenListeners = new Set<() => void>();

export function setAuthToken(token: string | null) {
  if (token === authToken) return;
  authToken = token;
  // 换人 / 退出登录时必须让所有数据 hook 丢掉上一位账号的结果
  tokenListeners.forEach((listener) => listener());
}

/** 令牌变化订阅：数据层用它在下一次会话开始时重新拉取 */
export function subscribeAuthToken(listener: () => void): () => void {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
}

export function getAuthToken(): string | null {
  return authToken;
}

/** 会话失效（401）时由 SessionProvider 注册：清空本地会话并回到入口 */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  return /^https?:\/\//.test(path) ? path : `${base}${path}`;
}

/** 菜谱图存的是站内相对路径，取图时要补上 API 主机 */
export function resolveImageUrl(image: string | null | undefined): string | null {
  if (!image) return null;
  return apiUrl(image);
}

/** 受会话保护的图片（打卡照片）必须带头取，裸 URL 会被拒 */
export function authedImageSource(uri: string): { uri: string; headers?: Record<string, string> } {
  return authToken ? { uri, headers: { Authorization: `Bearer ${authToken}` } } : { uri };
}

/**
 * 这张图是不是需要会话才能读。
 * 站内上传的图片（/api/photos/<id>）按会话校验归属；
 * /images/* 这类静态资源与外部 URL 不需要，也不该多带一个 Authorization 头。
 */
export function isProtectedImage(uri: string): boolean {
  if (!uri) return false;
  // 相对路径一定是站内；绝对地址要比对一下主机，避免把令牌发给第三方
  if (uri.startsWith('/')) return uri.startsWith('/api/photos/');
  try {
    return new URL(uri).origin === new URL(getApiBaseUrl()).origin && uri.includes('/api/photos/');
  } catch {
    return false;
  }
}

function buildHeaders(init?: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-daily-client': 'native',
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const extra = init?.headers as Record<string, string> | undefined;
  if (extra) Object.assign(headers, extra);
  return headers;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(apiUrl(path), { ...init, headers: buildHeaders(init) });
  if (res.status === 401) unauthorizedHandler?.();
  return res;
}

/** 先到先得：请求赢就用请求，超时就用兜底值 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function readError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? '操作失败，请稍后再试';
}

async function send<T>(path: string, init?: RequestInit, timeoutMs = WRITE_TIMEOUT_MS) {
  try {
    const res = await withTimeout(request(path, init), timeoutMs, null as Response | null);
    if (!res) return { ok: false as const, error: '网络超时，请重试' };
    if (!res.ok) return { ok: false as const, error: await readError(res), status: res.status };
    const data = (await res.json().catch(() => null)) as T | null;
    if (data === null) return { ok: false as const, error: '服务返回异常，请重试' };
    return { ok: true as const, data };
  } catch {
    return { ok: false as const, error: '网络异常，请检查网络后重试' };
  }
}

/** 读：失败与超时都回 null，界面据此走空态 */
export function apiGet<T>(path: string, timeoutMs = READ_TIMEOUT_MS): Promise<T | null> {
  return withTimeout(
    request(path).then(async (res) => (res.ok ? ((await res.json()) as T) : null)),
    timeoutMs,
    null
  );
}

export function apiGetJson<T>(path: string) {
  return send<T>(path, { method: 'GET' });
}

export function apiPost<T>(path: string, body?: unknown) {
  return send<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPatch<T>(path: string, body: unknown) {
  return send<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function apiDelete<T>(path: string) {
  return send<T>(path, { method: 'DELETE' });
}

/** multipart 上传：不要手写 Content-Type，交给运行时补 boundary */
export function apiUpload<T>(path: string, form: FormData) {
  return send<T>(path, { method: 'POST', body: form }, 20000);
}

export function apiSend<T>(path: string, init: RequestInit) {
  return send<T>(path, init);
}
