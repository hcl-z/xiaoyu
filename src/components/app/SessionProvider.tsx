"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEMO_EMAIL } from "@/lib/content";
import { postAuth } from "@/components/app/auth/auth-api";

export type SessionUser = { id: number; email: string; name: string };

type SessionCtx = {
  user: SessionUser;
  isDemo: boolean;
  signingOut: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  const [signingOut, setSigningOut] = useState(false);

  const signOut = useCallback(async () => {
    setSigningOut(true);
    await postAuth("logout");
    // 整页跳转：清空内存中的会话缓存，下一位登录者不会看到上一位的数据
    window.location.replace("/login");
  }, []);

  const value = useMemo(
    () => ({ user, isDemo: user.email === DEMO_EMAIL, signingOut, signOut }),
    [user, signingOut, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
