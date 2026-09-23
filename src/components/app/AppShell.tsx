"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIndicator, StatusBar } from "@/components/ds";
import { AppTabs } from "@/components/app/AppTabs";
import {
  CheckinDeepLink,
  CheckinFab,
  CheckinProvider,
} from "@/components/app/CheckinProvider";
import { SessionProvider, type SessionUser } from "@/components/app/SessionProvider";
import { layout } from "@/design/tokens";

const TAB_PATHS: Record<string, string> = {
  "/today": "today",
  "/recipes": "recipes",
  "/profile": "profile",
};

/** 应用外壳：私人账号或演示访客共用设备列、状态栏、标签栏与打卡键 */
export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const tab = TAB_PATHS[pathname];
  /* Push 页面横向推入；Tab 根页面轻微上浮 */
  const pushed =
    (pathname.startsWith("/recipes/") && pathname !== "/recipes") ||
    pathname.startsWith("/profile/");

  return (
    <SessionProvider user={user}>
      <CheckinProvider>
        <Suspense fallback={null}>
          <CheckinDeepLink />
        </Suspense>

        <div className="relative flex min-h-dvh justify-center bg-paper-deep">
          <div
            className="relative flex min-h-dvh w-full flex-col bg-paper lg:shadow-float"
            style={{ maxWidth: layout.appMaxW }}
          >
            <StatusBar />
            <div
              key={pathname}
              className={`flex flex-1 flex-col ${pushed ? "animate-enter" : "animate-enter-up"}`}
            >
              {children}
            </div>

            {tab ? (
              <>
                <div
                  className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-full -translate-x-1/2"
                  style={{ maxWidth: layout.appMaxW }}
                >
                  <div className="flex justify-end px-5 pb-[100px]">
                    <CheckinFab />
                  </div>
                </div>
                <div
                  className="fixed bottom-0 left-1/2 z-40 w-full -translate-x-1/2"
                  style={{ maxWidth: layout.appMaxW }}
                >
                  <AppTabs active={tab} />
                </div>
              </>
            ) : (
              <HomeIndicator />
            )}
          </div>

          <Link
            href="/"
            className="fixed bottom-6 left-6 z-50 hidden items-center gap-2 rounded-full bg-card px-4 py-2.5 text-[13px] font-semibold text-ink shadow-float transition-colors hover:text-indigo lg:inline-flex"
          >
            ← 展示台 / 设计系统
          </Link>
        </div>
      </CheckinProvider>
    </SessionProvider>
  );
}
