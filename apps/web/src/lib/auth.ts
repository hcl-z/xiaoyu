import { cache } from "react";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/session-cookie";

export type SessionUser = { id: number; email: string; name: string };

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* 密码：Node 内置 scrypt，无需原生依赖                                   */
/* ------------------------------------------------------------------ */
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function derive(
  password: string,
  salt: Buffer,
  keylen: number,
  N: number,
  r: number,
  p: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      keylen,
      { N, r, p, maxmem: 64 * 1024 * 1024 },
      (err, key) => (err ? reject(err) : resolve(key)),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, SCRYPT.keylen, SCRYPT.N, SCRYPT.r, SCRYPT.p);
  return [
    "scrypt",
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join(":");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, saltB64, keyB64] = stored.split(":");
  if (algo !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64url");
  const key = await derive(
    password,
    Buffer.from(saltB64, "base64url"),
    expected.length,
    Number(n),
    Number(r),
    Number(p),
  );
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** 邮箱不存在时也跑一次同成本的校验，避免通过响应时间探测邮箱是否已注册 */
let dummyHash: Promise<string> | null = null;
export async function burnPasswordCheck(password: string) {
  dummyHash ??= hashPassword(randomBytes(12).toString("hex"));
  await verifyPassword(password, await dummyHash);
}

/* ------------------------------------------------------------------ */
/* 会话：随机令牌放 httpOnly Cookie，数据库只存它的 SHA-256               */
/* ------------------------------------------------------------------ */
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  return { token, expiresAt };
}

async function validateSessionToken(token: string): Promise<SessionUser | null> {
  const id = hashToken(token);
  const [row] = await db
    .select({
      expiresAt: sessions.expiresAt,
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, id))
    .limit(1);
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }
  return { id: row.id, email: row.email, name: row.name };
}

export async function invalidateSession(token: string) {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}

/** 当前请求的登录用户；同一次服务端渲染内只查一次库 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return await validateSessionToken(token);
  } catch (error) {
    console.error("getCurrentUser failed", error);
    return null;
  }
});

/**
 * Secure 必须跟随「浏览器侧」的真实协议：
 * 写死 true 会让 HTTP 入口的 Cookie 被浏览器丢弃（表现为登录后不断弹回登录页）；
 * 写死 false 又会让 HTTPS 站点的会话可被明文窃取。
 * 反向代理常把 Host 改写成 localhost，因此还要回退看 Origin / Referer。
 */
async function cookieOptions() {
  const h = await headers();

  const forwarded = h.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  const browserOrigin = h.get("origin") ?? h.get("referer") ?? "";
  const host = h.get("host") ?? "";
  const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);

  let secure: boolean;
  if (browserOrigin.startsWith("https://")) {
    // 浏览器自报的页面来源最可信：部分反代会把 x-forwarded-proto
    // 写成「代理→容器」那一跳的 http，据此判断会错误地丢掉 Secure
    secure = true;
  } else if (browserOrigin.startsWith("http://")) {
    secure = false;
  } else if (forwarded === "https") {
    secure = true;
  } else {
    // 非浏览器请求：公网域名按 HTTPS 处理，本机按 HTTP
    secure = !isLocalHost;
  }

  return { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, { ...(await cookieOptions()), expires: expiresAt });
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", { ...(await cookieOptions()), maxAge: 0 });
}

export async function readSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export function unauthorized() {
  return NextResponse.json({ error: "请先登录" }, { status: 401 });
}

/* ------------------------------------------------------------------ */
/* 校验：与注册页实时规则保持一致                                          */
/* ------------------------------------------------------------------ */
export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "密码至少 8 个字符";
  if (password.length > 72) return "密码不能超过 72 个字符";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "密码需同时包含字母和数字";
  return null;
}

/* ------------------------------------------------------------------ */
/* 暴力破解防护（进程内）：同一邮箱 10 分钟内最多失败 8 次                   */
/* ------------------------------------------------------------------ */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 8;
const failures = new Map<string, { count: number; first: number }>();

export function isThrottled(key: string) {
  const entry = failures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordFailure(key: string) {
  const entry = failures.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    failures.set(key, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

export function clearFailures(key: string) {
  failures.delete(key);
}
