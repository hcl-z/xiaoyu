"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIndicator } from "@/components/ds";
import { layout } from "@/design/tokens";

/** 欢迎 / 登录 / 注册：与应用内相同的设备列外壳，但没有标签栏与打卡入口 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  /* 登录、注册由欢迎页推入：横向进入；欢迎页本身上浮出现 */
  const pushed = pathname !== "/welcome";

  return (
    <div className="relative flex min-h-dvh justify-center bg-paper-deep">
      <div
        className="relative flex min-h-dvh w-full flex-col bg-paper lg:shadow-float"
        style={{ maxWidth: layout.appMaxW }}
      >
        <div
          key={pathname}
          className={`flex flex-1 flex-col ${pushed ? "animate-enter" : "animate-enter-up"}`}
        >
          {children}
        </div>
        <HomeIndicator />
      </div>

      <Link
        href="/"
        className="fixed bottom-6 left-6 z-50 hidden items-center gap-2 rounded-full bg-card px-4 py-2.5 text-[13px] font-semibold text-ink shadow-float transition-colors hover:text-indigo lg:inline-flex"
      >
        ← 展示台 / 设计系统
      </Link>
    </div>
  );
}
