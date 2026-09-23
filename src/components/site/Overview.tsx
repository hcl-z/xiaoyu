"use client";

import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Database } from "lucide-react";
import {
  Badge,
  Body,
  Button,
  Caption,
  Card,
  Display,
  Micro,
  Pill,
  SectionHeader,
  Stat,
  Subhead,
  Title,
  Wordmark,
} from "@/components/ds";
import { KIND_COLOR, ROUTES, type Route } from "@/lib/routes";
import { DevicePreview } from "./DevicePreview";
import { RouteLegend, RouteMap } from "./RouteMap";

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const STEPS: { n: string; route: Route; desc: string }[] = [
  { n: "01", route: "welcome", desc: "不含摄影图片的启动页：矢量碗与热气、一句主张；「开始使用」注册，「先逛逛」直达演示账号。" },
  { n: "02", route: "register", desc: "昵称 / 邮箱 / 密码三项，密码规则实时勾选；注册即获得 6 道入门菜谱，制作次数从 0 开始。" },
  { n: "03", route: "login", desc: "点击「登录」免验证进入演示主页；需要私人数据时，可切换到账号密码登录。" },
  { n: "04", route: "today", desc: "周历条可前后翻周并跳任意过去日期；饮食记录流水随时记录或修改。" },
  { n: "05", route: "checkin", desc: "右下角悬浮键就地唤起弹层：餐次按时间智能默认，搜索框同时承担找菜谱与手动输入。" },
  { n: "06", route: "recipes", desc: "搜索 + 单排分类 chips（含收藏）；默认视图才有特写大卡，筛选后结果平铺。" },
  { n: "07", route: "recipe", desc: "图片上透明导航条（收藏 / 编辑），食材逐条勾选，底栏固定主操作。" },
  { n: "08", route: "newRecipe", desc: "单一「完成」动作；名称为空时置灰，保存后直接进入详情。" },
  { n: "09", route: "editRecipe", desc: "与新增共用编辑器：结构化食材分组与步骤行，删除走 Alert 确认。" },
  { n: "10", route: "profile", desc: "连续天数、28 天热力图、内容管理与账号区；退出登录走 Alert 确认。" },
  { n: "11", route: "categories", desc: "分类就地新增，改名同步菜谱，占用中的分类禁止删除。" },
  { n: "12", route: "tags", desc: "标签就地新增；删除时从菜谱上摘除标签，菜谱本身保留。" },
];

export function Overview() {
  const [route, setRoute] = useState<Route>("today");
  const meta = ROUTES.find((r) => r.id === route)!;
  const activeTab = meta.tab ?? "today";

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ---------------- hero ---------------- */}
      <section id="top" className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-24 h-[420px] w-[420px] rounded-full bg-indigo/12 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-1/2 h-[360px] w-[360px] rounded-full bg-lake/12 blur-3xl" />

        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-20">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="gray">iOS 18 · 中文</Badge>
              <Micro>菜谱管理 · 每日饮食打卡 · 设计系统 v1.0</Micro>
            </div>

            <h1 className="mt-6 text-[clamp(64px,11vw,132px)] leading-[0.86]">
              <Wordmark className="text-[0.92em]" />
            </h1>

            <Display className="mt-7 max-w-[20ch] text-[clamp(24px,3.4vw,38px)] leading-[1.35]">
              把菜谱收进抽屉，
              <br />
              把每一次吃饭记成线条。
            </Display>

            <Body tone="soft" className="mt-6 max-w-[46ch] leading-[1.9]">
              daily + 是一款精致柔和的 iOS 应用：收藏你的菜谱，也记录你每一天吃过的饭。
              这套展示台按「先设计系统、再组件、最后页面」的顺序交付——右侧的手机里跑的就是真实路由。
            </Body>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" href="/today" icon={<ArrowUpRight size={16} />}>
                进入应用
              </Button>
              <Button size="lg" variant="gray" href="/design-system" icon={<ArrowDown size={15} />}>
                查看设计系统
              </Button>
            </div>

            <dl className="mt-10 grid max-w-[540px] grid-cols-2 gap-y-5 border-t border-hair pt-6 sm:grid-cols-4">
              {[
                { k: "12", v: "真实路由" },
                { k: "1", v: "种版式语言" },
                { k: "3", v: "种导航范式" },
                { k: "6", v: "段圆角" },
              ].map((s) => (
                <div key={s.v}>
                  <Metricish value={s.k} />
                  <Caption className="mt-1.5 block">{s.v}</Caption>
                </div>
              ))}
            </dl>
          </div>

          <div className="mx-auto lg:translate-x-4">
            <div className="origin-top scale-[0.86] sm:scale-100">
              <DevicePreview path="/welcome" title="daily + 欢迎页" />
            </div>
            <div className="mt-4 flex max-w-[330px] items-center justify-between px-1">
              <Micro>01 · 欢迎页</Micro>
              <Caption>无摄影图片 · 纯矢量与排版</Caption>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- prototype lab ---------------- */}
      <section id="lab" className="scroll-mt-16 border-y border-hair bg-paper-deep/60 py-16">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Micro tone="accent">02 · INTERACTIVE PROTOTYPE</Micro>
              <Display className="mt-3 text-[clamp(28px,4vw,42px)]">任意切换，点哪走哪</Display>
            </div>
            <Body tone="muted" className="max-w-[44ch]">
              这台设备里是真机渲染的 Next.js 路由：可以直接搜索菜谱、勾选食材、完成打卡。未登录时展示公共演示数据；如果已登录私人账号，则展示你自己的数据。
            </Body>
          </Reveal>

          <div className="grid gap-10 lg:grid-cols-[1fr_390px]">
            <div className="order-last lg:order-first">
              <div id="map" className="scroll-mt-20">
                <Card className="p-4 sm:p-6">
                  <SectionHeader
                    label="路由图"
                    title={<Subhead as="span">点击节点切换右侧屏幕</Subhead>}
                    trailing={
                      <a
                        href={meta.demoPath}
                        target="_blank"
                        rel="noreferrer"
                        className="text-caption text-indigo hover:underline"
                      >
                        新标签打开 →
                      </a>
                    }
                  />
                  <RouteMap active={route} onSelect={setRoute} />
                  <div className="mt-4 border-t border-hair pt-4">
                    <RouteLegend />
                  </div>
                </Card>
              </div>

              <div className="mt-8 space-y-3">
                {STEPS.map((s) => {
                  const m = ROUTES.find((r) => r.id === s.route)!;
                  const active = route === s.route;
                  return (
                    <button
                      key={s.n}
                      type="button"
                      onClick={() => setRoute(s.route)}
                      className={`group flex w-full gap-4 rounded-group border p-4 text-left transition-all duration-300 ${
                        active
                          ? "border-indigo bg-card shadow-card"
                          : "border-hair bg-card/60 hover:-translate-y-0.5 hover:border-indigo/40"
                      }`}
                    >
                      <span className={`u-num text-[22px] leading-none ${active ? "text-indigo" : "text-muted/60 group-hover:text-indigo"}`}>
                        {s.n}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <Title as="span" className="text-[16px]">
                            {m.name}
                          </Title>
                          <Badge
                            className="border-0"
                            tone="gray"
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: KIND_COLOR[m.kind] }} />
                            {m.kind}
                          </Badge>
                          <Micro className="ml-auto">{m.transition}</Micro>
                        </span>
                        <Caption className="mt-1.5 block leading-relaxed">{s.desc}</Caption>
                        <code className="mt-2 block font-mono text-[11.5px] text-indigo">{m.path}</code>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="order-first lg:order-last">
              <div className="lg:sticky lg:top-20">
                <DevicePreview path={meta.demoPath} title={`daily + ${meta.name}`} />
                <div className="mx-auto mt-4 flex max-w-[390px] items-center justify-between gap-3 px-1">
                  <Micro>{meta.name} · {meta.kind}</Micro>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-lake" />
                    <Caption>{meta.data}</Caption>
                  </span>
                </div>
                <div className="mx-auto mt-3 flex max-w-[390px] flex-wrap gap-1.5">
                  {meta.uses.map((u) => (
                    <Badge key={u} tone="gray">
                      {u}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- all screens ---------------- */}
      <section id="screens" className="scroll-mt-16 py-16">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal className="mb-8">
            <Micro tone="accent">03 · ALL SCREENS</Micro>
            <Display className="mt-3 text-[clamp(28px,4vw,42px)]">全部移动端页面</Display>
            <Body tone="muted" className="mt-3 max-w-[62ch]">
              12 个路由的实时渲染，全部由同一套组件搭成。每一台都可直接点击交互。
            </Body>
          </Reveal>

          <div className="no-scrollbar -mx-5 flex gap-6 overflow-x-auto px-5 pb-4">
            {ROUTES.map((r) => (
              <Reveal key={r.id} className="shrink-0">
                <DevicePreview path={r.demoPath} title={`daily + ${r.name}`} scale={0.66} />
                <div className="mt-4 w-[270px]">
                  <div className="flex items-baseline justify-between gap-2">
                    <Title as="span" className="text-[15px]">
                      {r.name}
                    </Title>
                    <Micro>{r.kind}</Micro>
                  </div>
                  <code className="mt-1 block font-mono text-[11px] text-indigo">{r.path}</code>
                  <Caption className="mt-2 block leading-relaxed">{r.purpose}</Caption>
                  <a
                    href={r.demoPath}
                    className="mt-2 inline-block text-[12px] font-semibold text-indigo hover:underline"
                  >
                    单独打开 →
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- system summary ---------------- */}
      <section id="system" className="scroll-mt-16 border-t border-hair bg-paper-deep/60 py-16">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Micro tone="accent">04 · DESIGN SYSTEM</Micro>
              <Display className="mt-3 text-[clamp(28px,4vw,42px)]">先立规则，再搭页面</Display>
            </div>
            <Button variant="gray" href="/design-system">
              完整设计系统 →
            </Button>
          </Reveal>

          <div className="grid gap-4 lg:grid-cols-3">
            <Reveal className="lg:col-span-2">
              <Card className="h-full">
                <Subhead>三层架构</Subhead>
                <div className="mt-5 space-y-4">
                  {[
                    {
                      n: "L1",
                      t: "Tokens",
                      d: "颜色 / 字阶 / 圆角 / 间距 / 阴影 / 动效，以 CSS 变量落在 @theme，并由 tokens.ts 镜像给 JS 与 SVG。",
                      code: "globals.css · src/design/tokens.ts",
                    },
                    {
                      n: "L2",
                      t: "Components",
                      d: "30+ 个组件与文本原语，全部导出在 @/components/ds。页面不允许写死任何视觉数值。",
                      code: "src/components/ds/*",
                    },
                    {
                      n: "L3",
                      t: "Pages",
                      d: "12 个路由只做组合与数据编排，交互链路与 API 一一对应。",
                      code: "src/app/(app)/*",
                    },
                  ].map((l) => (
                    <div key={l.n} className="flex gap-4 border-t border-hair pt-4">
                      <Metricish value={l.n} />
                      <div>
                        <Body className="font-semibold">{l.t}</Body>
                        <Caption className="mt-1 block leading-relaxed">{l.d}</Caption>
                        <code className="mt-1.5 block font-mono text-[11px] text-indigo">{l.code}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>

            <Reveal>
              <Card className="h-full">
                <Subhead>色板</Subhead>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ["#F2F2F7", "分组底"],
                    ["#FFFFFF", "卡面"],
                    ["#EBEBF0", "系统填充"],
                    ["#1C1C1E", "标签黑"],
                    ["#6B6B70", "三级灰"],
                    ["#E3E3E8", "分隔线"],
                    ["#007AFF", "系统蓝"],
                    ["#34C759", "系统绿"],
                    ["#FF3B30", "系统红"],
                  ].map(([hex, name]) => (
                    <div key={hex}>
                      <div
                        className="h-12 rounded-thumb border border-hair/70"
                        style={{ background: hex }}
                      />
                      <Caption className="mt-1 block text-center">{name}</Caption>
                    </div>
                  ))}
                </div>
                <div className="mt-5 space-y-3 border-t border-hair pt-4">
                  <Stat value="34 / 41" label="Large Title · SF 700" />
                  <Stat value="17 / 22" label="Headline · 行主文案" />
                  <Stat value="22" label="卡片圆角（唯一容器值）" unit=" px" />
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- route table ---------------- */}
      <section id="routes" className="scroll-mt-16 py-16">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <Micro tone="accent">05 · ROUTES</Micro>
            <Display className="mt-3 text-[clamp(28px,4vw,42px)]">路由表</Display>
          </Reveal>

          <Reveal className="mt-8 overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[840px] border-collapse text-left">
              <thead>
                <tr className="border-y border-ink/15">
                  {["路由", "页面", "用途", "类型", "转场", "数据"].map((h) => (
                    <th key={h} className="py-3 pr-6">
                      <Micro>{h}</Micro>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROUTES.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setRoute(r.id)}
                    className={`cursor-pointer border-b border-hair transition-colors hover:bg-card ${
                      route === r.id ? "bg-card" : ""
                    }`}
                  >
                    <td className="py-4 pr-6 font-mono text-[12.5px] text-indigo">{r.path}</td>
                    <td className="py-4 pr-6">
                      <Title as="span" className="text-[15px]">
                        {r.name}
                      </Title>
                    </td>
                    <td className="max-w-[36ch] py-4 pr-6">
                      <Caption tone="soft" className="leading-relaxed">
                        {r.purpose}
                      </Caption>
                    </td>
                    <td className="py-4 pr-6">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: KIND_COLOR[r.kind] }} />
                        <Caption tone="ink">{r.kind}</Caption>
                      </span>
                    </td>
                    <td className="py-4 pr-6">
                      <Caption>{r.transition}</Caption>
                    </td>
                    <td className="py-4 pr-6 font-mono text-[11.5px] text-muted">{r.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>

          <Reveal className="mt-12 grid gap-6 border-t border-hair pt-8 sm:grid-cols-3">
            <div>
              <Micro className="mb-2 block">字体</Micro>
              <Body tone="soft" className="leading-[1.75]">
                SF Pro（Apple 设备原生）/ Inter（其他平台回退）+ PingFang / Noto Sans SC。字阶与字重完全对应 iOS 文本样式。
              </Body>
            </div>
            <div>
              <Micro className="mb-2 block">数据</Micro>
              <Body tone="soft" className="flex items-start gap-2 leading-[1.75]">
                <Database size={15} className="mt-1 shrink-0 text-indigo" />
                PostgreSQL + Drizzle：recipes 与 checkins 两张表。API 首屏自动播种，数据库不可用时降级为本地内容，设计稿永远能打开。
              </Body>
            </div>
            <div>
              <Micro className="mb-2 block">交付顺序</Micro>
              <Body tone="soft" className="leading-[1.75]">
                ① Tokens ② 组件与文本原语 ③ 设计系统文档页 ④ 页面组合。任何页面都能追溯到它使用的组件与 token。
              </Body>
            </div>
          </Reveal>

          <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-hair pt-8">
            <Pill tone="accent" active>
              下一个入口
            </Pill>
            <Button href="/design-system" variant="inverse">
              打开设计系统文档
            </Button>
            <Button href="/today" variant="gray">
              直接体验应用
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-hair py-8">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 sm:px-8">
          <Wordmark className="text-[19px]" />
          <Caption>菜谱管理与每日饮食打卡 · 精致柔和 iOS 风 · 设计系统 v1.0</Caption>
          <Micro>DESIGNED &amp; BUILT IN 2026</Micro>
        </div>
      </footer>

    </div>
  );
}

function Metricish({ value }: { value: string }) {
  return (
    <Cell>
      <span className="u-num text-[30px] font-semibold leading-none">{value}</span>
    </Cell>
  );
}

function Cell({ children }: { children: ReactNode }) {
  return <span className="block">{children}</span>;
}
