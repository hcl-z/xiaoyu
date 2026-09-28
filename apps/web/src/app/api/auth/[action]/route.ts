import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  burnPasswordCheck,
  clearFailures,
  clearSessionCookie,
  createSession,
  getCurrentUser,
  hashPassword,
  invalidateSession,
  isThrottled,
  isValidEmail,
  normalizeEmail,
  passwordProblem,
  readSessionToken,
  recordFailure,
  setSessionCookie,
  verifyPassword,
  type SessionUser,
} from "@/lib/auth";
import { ensureDemoUser, seedStarterContent } from "@/lib/seed-user";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ action: string }> };

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

/**
 * 原生客户端（x-daily-client: native）拿不到 httpOnly Cookie，
 * 需要把令牌带回自己保存；浏览器继续只看 Cookie，令牌不进 JS 可达范围。
 */
async function startSession(request: Request, user: SessionUser, status = 200) {
  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);
  const wantsToken = request.headers.get("x-daily-client") === "native";
  return NextResponse.json(wantsToken ? { user, token } : { user }, { status });
}

async function register(request: Request) {
  const body = await readBody(request);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || name.length > 20) return fail("昵称需为 1–20 个字");
  if (!isValidEmail(email)) return fail("请输入有效的邮箱地址");
  const problem = passwordProblem(password);
  if (problem) return fail(problem);

  const [exists] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (exists) return fail("该邮箱已注册，可直接登录", 409);

  let user: SessionUser | undefined;
  try {
    const inserted = await db
      .insert(users)
      .values({ email, name, passwordHash: await hashPassword(password) })
      .returning({ id: users.id, email: users.email, name: users.name });
    user = inserted[0];
  } catch (error) {
    if (isUniqueViolation(error)) return fail("该邮箱已注册，可直接登录", 409);
    throw error;
  }
  if (!user) return fail("注册失败，请稍后再试", 500);

  try {
    await seedStarterContent(user.id);
  } catch (error) {
    // 起步菜谱只是锦上添花，失败不应阻止用户进入应用
    console.error("seedStarterContent failed", error);
  }
  return startSession(request, user, 201);
}

async function login(request: Request) {
  const body = await readBody(request);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return fail("请输入邮箱和密码");
  if (isThrottled(email)) return fail("尝试次数过多，请 10 分钟后再试", 429);

  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let ok = false;
  if (row) ok = await verifyPassword(password, row.passwordHash);
  else await burnPasswordCheck(password);

  if (!row || !ok) {
    recordFailure(email);
    return fail("邮箱或密码不正确", 401);
  }
  clearFailures(email);
  return startSession(request, { id: row.id, email: row.email, name: row.name });
}

async function logout() {
  const token = await readSessionToken();
  if (token) await invalidateSession(token).catch(() => undefined);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

async function demo(request: Request) {
  return startSession(request, await ensureDemoUser());
}

export async function GET(_request: Request, { params }: Context) {
  const { action } = await params;
  if (action !== "me") return fail("Not found", 404);
  const user = await getCurrentUser();
  return user
    ? NextResponse.json({ user })
    : NextResponse.json({ user: null }, { status: 401 });
}

export async function POST(request: Request, { params }: Context) {
  const { action } = await params;
  try {
    switch (action) {
      case "register":
        return await register(request);
      case "login":
        return await login(request);
      case "logout":
        return await logout();
      case "demo":
        return await demo(request);
      default:
        return fail("Not found", 404);
    }
  } catch (error) {
    console.error(`POST /api/auth/${action} failed`, error);
    return fail("服务暂时不可用，请稍后再试", 500);
  }
}
