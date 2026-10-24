/**
 * daily + · SESSION
 * ------------------------------------------------------------------
 * 认证交给 Supabase Auth：令牌持久化与自动刷新由 supabase-js 负责，
 * 这里只把「登录 / 注册 / 退出」翻译成应用内的会话语义。
 * 新账号注册成功后写入起步菜谱与默认分类标签。
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

import { supabase } from '@/data/supabase';
import { resetDataCaches } from '@/data/store';
import { STARTER_RECIPES, DEFAULT_CATEGORIES, DEFAULT_TAGS } from '@/data/starter';
import type { SessionUser } from '@/data/types';

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';
export type AuthOutcome = { ok: true } | { ok: false; error: string };

type SessionValue = {
  status: SessionStatus;
  user: SessionUser | null;
  busy: boolean;
  signIn: (email: string, password: string) => Promise<AuthOutcome>;
  register: (name: string, email: string, password: string) => Promise<AuthOutcome>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

function toSessionUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): SessionUser {
  const metaName = user.user_metadata?.name;
  const email = user.email ?? '';
  return {
    id: user.id,
    email,
    name: typeof metaName === 'string' ? metaName : email.split('@')[0] || '我',
  };
}

/** 新账号的起步内容：6 道入门菜谱 + 默认分类 / 标签 */
async function seedStarterContent(uid: string) {
  const { error: recipeError } = await supabase.from('recipes').insert(
    STARTER_RECIPES.map((r) => ({
      user_id: uid,
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle,
      category: r.category,
      minutes: r.minutes,
      servings: r.servings,
      image: r.image,
      favorite: r.favorite,
      cooked: 0,
      tags: r.tags,
      ingredients: r.ingredients,
      steps: r.steps,
    }))
  );
  if (recipeError) throw new Error(recipeError.message);
  const { error: taxError } = await supabase.from('taxonomies').insert([
    ...DEFAULT_CATEGORIES.map((name) => ({
      user_id: uid,
      kind: 'category',
      name,
      sort_order: 0,
    })),
    ...DEFAULT_TAGS.map((name, i) => ({ user_id: uid, kind: 'tag', name, sort_order: i })),
  ]);
  if (taxError) throw new Error(taxError.message);
}

/** 空账号（一道菜谱都没有）补一份起步内容；已有内容的账号不动 */
async function seedStarterContentIfEmpty(uid: string) {
  const { count, error } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', uid);
  if (error) return;
  if ((count ?? 0) > 0) return;
  await seedStarterContent(uid);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(toSessionUser(session.user));
        setStatus('signedIn');
      } else {
        setUser(null);
        setStatus('signedOut');
      }
    });
    // 冷启动：先取一次已持久化的会话
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(toSessionUser(data.session.user));
        setStatus('signedIn');
      } else {
        setStatus('signedOut');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const enter = useCallback(
    async (path: 'login' | 'signup', args: Record<string, unknown>): Promise<AuthOutcome> => {
      setBusy(true);
      try {
        const { data, error } =
          path === 'login'
            ? await supabase.auth.signInWithPassword({
                email: args.email as string,
                password: args.password as string,
              })
            : await supabase.auth.signUp({
                email: args.email as string,
                password: args.password as string,
                options: { data: { name: args.name as string } },
              });
        if (error) return { ok: false, error: error.message };
        const authUser = data.user;
        if (!authUser) return { ok: false, error: '服务没有返回账号，请稍后再试' };
        // signUp 在开启邮箱确认时没有 session：明确告诉用户下一步
        if (path === 'signup' && !data.session) {
          return { ok: false, error: '注册成功：请到邮箱完成确认后再登录' };
        }
        setUser(toSessionUser(authUser));
        setStatus('signedIn');
        /**
         * 起步内容在成功进入后保证存在：
         * 注册路径直接种；登录路径查一遍——邮箱确认后手动登录的账号
         * 会错过注册时的种子，这里补上。失败不挡进入。
         */
        try {
          if (path === 'signup') {
            await seedStarterContent(authUser.id);
          } else {
            await seedStarterContentIfEmpty(authUser.id);
          }
        } catch {
          // 起步内容只是锦上添花
        }
        return { ok: true };
      } catch {
        return { ok: false, error: '网络异常，请检查网络后重试' };
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const signIn = useCallback(
    (email: string, password: string) => enter('login', { email: email.trim(), password }),
    [enter]
  );

  const register = useCallback(
    (name: string, email: string, password: string) =>
      enter('signup', { name: name.trim(), email: email.trim(), password }),
    [enter]
  );

  const signOut = useCallback(async () => {
    setBusy(true);
    await supabase.auth.signOut();
    resetDataCaches();
    setUser(null);
    setStatus('signedOut');
    setBusy(false);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ status, user, busy, signIn, register, signOut }),
    [status, user, busy, signIn, register, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
