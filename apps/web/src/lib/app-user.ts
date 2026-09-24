import { cache } from "react";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import { ensureDemoUser } from "@/lib/seed-user";

/**
 * 应用访问者：有有效会话就用本人的私有数据；无会话/会话失效时，
 * 仅进入公开的演示账号。不会把其他注册用户的数据暴露给访客。
 *
 * 免验证入口不依赖浏览器存 Cookie，解决当前预览环境的登录重定向循环。
 */
export const getAppUser = cache(async (): Promise<SessionUser> => {
  const user = await getCurrentUser();
  return user ?? ensureDemoUser();
});
