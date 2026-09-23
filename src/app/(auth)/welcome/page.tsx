"use client";

import { useRouter } from "next/navigation";
import { BookOpen, CalendarCheck, ChartColumn } from "lucide-react";
import { Body, Button, Caption, Display, Section, Wordmark } from "@/components/ds";
import { BowlMark } from "@/components/app/auth/BowlMark";

const FEATURES = [
  { icon: <BookOpen size={16} />, title: "菜谱库", note: "分类、用时、可勾选食材" },
  { icon: <CalendarCheck size={16} />, title: "每日打卡", note: "自由记录与连续天数" },
  { icon: <ChartColumn size={16} />, title: "习惯回顾", note: "28 天热力图" },
];

/** /welcome · 启动页：无摄影图片，只有排版与矢量线条 */
export default function WelcomePage() {
  const router = useRouter();

  /** 免验证入口：不依赖浏览器 Cookie，直接进入公共演示空间 */
  const browse = () => window.location.replace("/today");

  return (
    <div className="grain flex flex-1 flex-col bg-paper">
      <div className="flex items-center justify-between px-6 pt-1">
        <Wordmark className="text-[17px]" />
        <button
          type="button"
          onClick={browse}
          className="px-2 py-1 text-[15px] text-indigo transition-opacity active:opacity-50"
        >
          先逛逛
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-6">
        <BowlMark className="h-[88px] w-[104px]" />

        <Display as="h1" className="mt-7 max-w-[12ch] leading-[1.18]">
          把每一天，
          <br />
          煮成值得记录的样子
        </Display>

        <Body tone="muted" className="mt-3.5 max-w-[17rem] leading-[1.7]">
          daily + 收好你的菜谱，也收好每一餐认真吃过的证据。
        </Body>

        <Section className="mt-7">
          {FEATURES.map((f) => (
            <div key={f.title} className="u-sep flex items-center gap-3 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-tint text-indigo">
                {f.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-subhead font-medium text-ink">{f.title}</span>
                <Caption className="mt-0.5 block">{f.note}</Caption>
              </span>
            </div>
          ))}
        </Section>
      </div>

      <div className="px-6 pb-10">
        <Button size="lg" block onClick={() => router.push("/register")}>
          开始使用
        </Button>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-3.5 w-full py-1 text-[15px] text-indigo transition-opacity active:opacity-50"
        >
          我已有账号，登录
        </button>
      </div>
    </div>
  );
}
