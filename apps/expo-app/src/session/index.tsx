/**
 * daily + · SESSION
 * ------------------------------------------------------------------
 * 原生端不依赖 Cookie：登录 / 注册 / 演示入口拿到令牌后存进设备钥匙串，
 * 启动时用令牌换回当前用户，会话失效则回到入口。
 *
 * 与 Web 的差别只有传输方式；「点击登录直接进入公共演示空间」这条路径保留。
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { DEMO_EMAIL } from '@/domain/account';
import {
  apiGet,
  apiPost,
  getApiBaseUrl,
  setApiBaseUrl,
  setAuthToken,
  setUnauthorizedHandler,
} from '@/data/client';
import { readApiBaseOverride, writeApiBaseOverride } from '@/data/api-base';
import { resetDataCaches } from '@/data/store';
import type { SessionUser } from '@/data/types';

import { clearToken, readToken, writeToken } from './storage';

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';
export type AuthOutcome = { ok: true } | { ok: false; error: string };
export type ServerOutcome = { ok: true; effective: string } | { ok: false; error: string };

type SessionValue = {
  status: SessionStatus;
  user: SessionUser | null;
  isDemo: boolean;
  busy: boolean;
  signInDemo: () => Promise<AuthOutcome>;
  signIn: (email: string, password: string) => Promise<AuthOutcome>;
  register: (name: string, email: string, password: string) => Promise<AuthOutcome>;
  signOut: () => Promise<void>;
  /** 当前生效的服务器地址（我的 › 服务器地址里展示用） */
  serverUrl: string;
  /**
   * 切换服务器地址。令牌是发给某一台服务器的，换服务器等于换账号空间，
   * 所以切换后一律清空本地会话，回到欢迎页重新进入。
   * 传空字符串则恢复编译期默认地址。
   */
  switchServer: (input: string) => Promise<ServerOutcome>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

type AuthResponse = { user: SessionUser; token?: string };

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());

  /** 清空令牌与内存里的数据，下一位登录者不会看到上一位的记录 */
  const clearLocalSession = useCallback(async () => {
    setAuthToken(null);
    resetDataCaches();
    await clearToken();
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      // 先恢复用户上次设置的服务器地址，再发第一个网络请求
      const savedBase = await readApiBaseOverride();
      if (!alive) return;
      if (savedBase) setApiBaseUrl(savedBase);
      const token = await readToken();
      if (!alive) return;
      if (!token) {
        setStatus('signedOut');
        return;
      }
      setAuthToken(token);
      const me = await apiGet<{ user: SessionUser | null }>('/api/auth/me');
      if (!alive) return;
      if (me?.user) {
        setUser(me.user);
        setStatus('signedIn');
        return;
      }
      await clearLocalSession();
      if (alive) setStatus('signedOut');
    })();
    return () => {
      alive = false;
    };
  }, [clearLocalSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void (async () => {
        await clearLocalSession();
        setUser(null);
        setStatus('signedOut');
      })();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearLocalSession]);

  const enter = useCallback(async (path: string, body?: unknown): Promise<AuthOutcome> => {
    setBusy(true);
    try {
      const res = await apiPost<AuthResponse>(path, body);
      if (!res.ok) return { ok: false, error: res.error };
      if (!res.data.token) return { ok: false, error: '登录状态未能保存，请稍后再试' };

      // 先让内存里的会话生效，再落盘：钥匙串写入失败不该挡住这次进入，
      // 否则用户会停在原地，而令牌其实已经拿到了。
      setAuthToken(res.data.token);
      resetDataCaches();
      setUser(res.data.user);
      setStatus('signedIn');
      try {
        await writeToken(res.data.token);
      } catch {
        // 只影响「重启后免登录」，本次使用不受影响
      }
      return { ok: true };
    } catch {
      return { ok: false, error: '网络异常，请检查网络后重试' };
    } finally {
      setBusy(false);
    }
  }, []);

  const signInDemo = useCallback(() => enter('/api/auth/demo'), [enter]);

  const signIn = useCallback(
    (email: string, password: string) =>
      enter('/api/auth/login', { email: email.trim(), password }),
    [enter]
  );

  const register = useCallback(
    (name: string, email: string, password: string) =>
      enter('/api/auth/register', { name: name.trim(), email: email.trim(), password }),
    [enter]
  );

  const signOut = useCallback(async () => {
    setBusy(true);
    await apiPost('/api/auth/logout');
    await clearLocalSession();
    setUser(null);
    setStatus('signedOut');
    setBusy(false);
  }, [clearLocalSession]);

  const switchServer = useCallback(async (input: string): Promise<ServerOutcome> => {
    const trimmed = input.trim();
    if (!trimmed) {
      // 恢复默认：清掉覆盖值，回到编译期默认地址
      setApiBaseUrl(null);
      await writeApiBaseOverride(null);
    } else {
      const effective = setApiBaseUrl(trimmed);
      if (!effective) return { ok: false, error: '地址需要以 http:// 或 https:// 开头' };
      await writeApiBaseOverride(effective);
    }
    // 令牌与缓存都只对旧服务器有效，一并清空回到入口
    setAuthToken(null);
    resetDataCaches();
    await clearToken();
    setUser(null);
    setStatus('signedOut');
    setServerUrl(getApiBaseUrl());
    return { ok: true, effective: getApiBaseUrl() };
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      status,
      user,
      isDemo: user?.email === DEMO_EMAIL,
      busy,
      signInDemo,
      signIn,
      register,
      signOut,
      serverUrl,
      switchServer,
    }),
    [status, user, busy, signInDemo, signIn, register, signOut, serverUrl, switchServer]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
