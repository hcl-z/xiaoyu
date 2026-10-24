import { NextResponse, type NextRequest } from "next/server";

/**
 * Expo 网页预览（Metro :8081）与家庭局域网部署时，页面与 API 不同源，
 * 浏览器会先发 CORS 预检再放行请求；原生端没有同源策略，不受影响。
 * 令牌走 Authorization 请求头而非 Cookie，所以反射来源即可，不碰凭据模式。
 */
const ALLOW_HEADERS = "authorization, content-type, x-daily-client";

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
  return response;
}

export const config = { matcher: "/api/:path*" };
