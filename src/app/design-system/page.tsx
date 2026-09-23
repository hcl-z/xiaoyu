import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { DesignSystemDocs } from "@/components/site/DesignSystemDocs";

export const metadata: Metadata = {
  title: "daily + 设计系统 · Tokens / Components / Composition",
  description:
    "daily + 的三层设计系统：颜色、字阶、圆角、间距、阴影、动效、图标与全部组件规格。",
};

export default function DesignSystemPage() {
  return (
    <>
      <SiteNav />
      <DesignSystemDocs />
    </>
  );
}
