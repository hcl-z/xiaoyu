/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "daily + · 精致柔和的 iOS 菜谱管理与饮食打卡应用",
  description:
    "daily + 的三层设计系统（Tokens → Components → Pages）、7 个真实路由与完整交互链路。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      {/*
        字体走系统栈（globals.css @theme 已按 Apple → Inter → PingFang/Noto 排好），
        不再外链 Google Fonts：一是国内加载不可靠，二是 SF Pro/PingFang 本就是设计目标。
      */}
      <body className="min-h-screen bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
