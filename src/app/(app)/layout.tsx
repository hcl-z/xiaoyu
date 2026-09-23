import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { getAppUser } from "@/lib/app-user";

export const dynamic = "force-dynamic";

/**
 * 真实登录用户读取私有空间；未登录或 Cookie 未落地时，只进入公共演示空间。
 * 不重定向到登录页，保证「点击登录直接进主页」不会来回跳转。
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getAppUser();
  return <AppShell user={user}>{children}</AppShell>;
}
