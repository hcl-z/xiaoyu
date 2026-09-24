import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { Overview } from "@/components/site/Overview";

export const metadata: Metadata = {
  title: "daily + · 菜谱管理与每日饮食打卡 · 设计系统展示台",
  description:
    "先设计系统、再组件、最后页面：daily + 的三层设计系统、7 个真实路由与完整交互链路。",
};

export default function Page() {
  return (
    <>
      <SiteNav />
      <Overview />
    </>
  );
}
