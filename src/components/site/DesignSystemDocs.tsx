"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Download,
  Heart,
  Info,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import {
  ActionRow,
  Alert,
  Badge,
  Bar,
  Body,
  BottomActionBar,
  Button,
  Caption,
  Card,
  CheckCircle,
  Checkmark,
  Display,
  Divider,
  EmptyState,
  FabButton,
  FieldRow,
  Heatmap,
  HeatmapLegend,
  HomeIndicator,
  IconButton,
  ListGroup,
  ListRow,
  MeterRow,
  Metric,
  Micro,
  NavBar,
  Pill,
  Ring,
  ScreenTransition,
  SearchField,
  Section,
  SectionHeader,
  Segmented,
  Sheet,
  Skeleton,
  Sparkbars,
  Stat,
  StatusBar,
  Stepper,
  Subhead,
  SuccessOverlay,
  Switch,
  TabBar,
  TextArea,
  TextInput,
  Title,
  TrailingChevron,
  Wordmark,
} from "@/components/ds";
import {
  color,
  colorGroups,
  elevation,
  icons,
  layout,
  motion as mt,
  principles,
  radiusTokens,
  spacing,
  typeScale,
} from "@/design/tokens";
import { ROUTES } from "@/lib/routes";

const SECTIONS = [
  { id: "principles", index: "01", title: "设计原则" },
  { id: "color", index: "02", title: "色彩" },
  { id: "type", index: "03", title: "字体与字阶" },
  { id: "geometry", index: "04", title: "圆角 · 间距 · 阴影" },
  { id: "motion", index: "05", title: "动效" },
  { id: "icons", index: "06", title: "图标" },
  { id: "components", index: "07", title: "组件" },
  { id: "composition", index: "08", title: "页面组合规范" },
];

function Head({
  id,
  index,
  title,
  note,
  children,
}: {
  id: string;
  index: string;
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-hair pb-3">
        <Metric as="span" className="text-[13px]" tone="accent">
          {index}
        </Metric>
        <Title as="h3" className="text-[20px]">
          {title}
        </Title>
        <Micro className="ml-auto">{note}</Micro>
      </div>
      {children}
    </section>
  );
}

function Demo({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <Section title={`${title} · ${note}`}>{children}</Section>
  );
}

export function DesignSystemDocs() {
  const [seg, setSeg] = useState<"day" | "week" | "month">("day");
  const [cat, setCat] = useState("主食");
  const [on, setOn] = useState(true);
  const [n, setN] = useState(2);
  const [query, setQuery] = useState("");
  const [field, setField] = useState("番茄牛腩饭");
  const [area, setArea] = useState("");
  const [done, setDone] = useState(true);
  const [selected, setSelected] = useState("轻食");
  const [tab, setTab] = useState("today");
  const [sheet, setSheet] = useState(false);
  const [alert, setAlert] = useState(false);
  const [saved, setSaved] = useState(false);
  const [push, setPush] = useState(true);

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-10 sm:px-8">
      <header className="mb-12">
        <Micro tone="accent">DAILY + DESIGN SYSTEM · v2.0</Micro>
        <Display className="mt-4 text-[clamp(30px,5vw,52px)]">
          柔和的卡片语言，三种导航范式
        </Display>
        <Body tone="soft" className="mt-4 max-w-[68ch] leading-[1.85]">
          三层结构：<b className="font-semibold text-ink">Tokens</b>（颜色 / 字阶 / 圆角 / 间距 / 阴影 / 动效，唯一真源）→
          <b className="font-semibold text-ink"> Components</b>（页面只能组合这里导出的积木）→
          <b className="font-semibold text-ink"> Pages</b>（只做组合与数据编排）。
          全部页面遵循同一条版式规则：<b className="font-semibold text-ink">
            灰底 + 悬浮白卡 + 发丝描边与极轻落影
          </b>
          ，列表用 18 圆角分组、行内分隔线在左侧缩进；
          导航只有 Large Title（Tab 根页）、紧凑导航条（Push 页）、弹层（Modal）三种。
        </Body>
        <div className="mt-6 flex flex-wrap gap-2">
          <Pill active>灰底 + 悬浮白卡</Pill>
          <Pill>3 种导航范式</Pill>
          <Pill>{colorGroups.reduce((s, g) => s + g.items.length, 0)} 个颜色</Pill>
          <Pill>{typeScale.length} 级字阶</Pill>
          <Pill>{radiusTokens.length} 段圆角</Pill>
          <Pill>{mt.uses.length} 种动效</Pill>
        </div>
      </header>

      <div className="grid gap-12 lg:grid-cols-[190px_1fr]">
        <nav className="lg:sticky lg:top-20 lg:self-start">
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:gap-0 lg:px-0">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex shrink-0 items-baseline gap-2.5 rounded-full bg-card px-3 py-1.5 text-[13px] text-muted transition-colors hover:text-indigo lg:mb-1 lg:rounded-group lg:bg-transparent lg:px-3 lg:py-2.5 lg:hover:bg-card"
              >
                <span className="u-num text-[11px] text-muted/70">{s.index}</span>
                {s.title}
              </a>
            ))}
          </div>
          <Section className="mt-6 hidden lg:block">
            <ListRow title="打开应用" subtitle="8 个真实路由" accessory="chevron" />
            <ListRow
              title="返回展示台"
              subtitle="交互原型 · 路由图"
              accessory="chevron"
              onClick={() => window.location.assign("/")}
            />
          </Section>
        </nav>

        <div className="space-y-16">
          {/* 01 */}
          <Head id="principles" index="01" title="设计原则" note="PRINCIPLES · 四条不可协商">
            <div className="grid gap-4 sm:grid-cols-2">
              {principles.map((p) => (
                <Section key={p.n} padded>
                  <Metric as="span" className="text-[15px]" tone="accent">
                    {p.n}
                  </Metric>
                  <Subhead className="mt-2">{p.t}</Subhead>
                  <Body tone="muted" className="mt-2 leading-[1.8]">
                    {p.d}
                  </Body>
                </Section>
              ))}
            </div>
          </Head>

          {/* 02 */}
          <Head id="color" index="02" title="色彩" note="COLOR · iOS 系统色板">
            <div className="space-y-8">
              {colorGroups.map((g) => (
                <div key={g.title}>
                  <div className="mb-3 flex flex-wrap items-baseline gap-3">
                    <Subhead as="span">{g.title}</Subhead>
                    <Caption>{g.note}</Caption>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {g.items.map((c) => (
                      <div key={c.token}>
                        <div
                          className="flex h-24 flex-col justify-between rounded-group p-3"
                          style={{
                            background: c.hex,
                            color: c.onInk ? color.ink : "#fff",
                            boxShadow: `inset 0 0 0 1px ${color.hair}`,
                          }}
                        >
                          <Micro className="opacity-80">{c.token}</Micro>
                          <span className="u-num text-[12px]">{c.hex}</span>
                        </div>
                        <div className="mt-2">
                          <Body as="span" className="font-medium">
                            {c.name}
                          </Body>
                          <Caption className="mt-0.5 block leading-snug">{c.role}</Caption>
                          <code className="mt-1 block font-mono text-[11px] text-muted">{c.cssVar}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Section className="mt-6" padded tone="tint">
              <Micro tone="accent">用色纪律</Micro>
              <Body tone="soft" className="mt-2 leading-[1.85]">
                蓝色 <b className="text-ink">#007AFF</b> 只出现在可交互元素上（按钮、链接、选中、进度），
                信息本身永远是标签黑；绿色 <b className="text-ink">#34C759</b> 只做填充（开关、完成对勾），
                浅底上的绿色文字换用深绿 <b className="text-ink">#1E8A3E</b>（4.5:1）；
                红色 <b className="text-ink">#FF3B30</b> 仅用于破坏性操作；橙色只允许出现在图表里，绝不进入界面骨架。
              </Body>
            </Section>
          </Head>

          {/* 03 */}
          <Head id="type" index="03" title="字体与字阶" note="TYPE · SF 文本样式">
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <Section padded className="grain">
                <Micro>字标</Micro>
                <div className="mt-3 text-[56px] leading-none">
                  <Wordmark />
                </div>
                <Divider className="my-5" />
                <Micro>LARGE TITLE · 34 / 41 BOLD</Micro>
                <Display className="mt-3 leading-tight">今天</Display>
                <Title className="mt-3">番茄牛腩饭</Title>
                <Subhead className="mt-3">今日记录</Subhead>
                <Body tone="muted" className="mt-4 leading-[1.8]">
                  系统字体栈：Apple 设备使用 SF Pro，其他平台回退 Inter，汉字交给 PingFang SC / Noto Sans SC。
                  层级完全由字号与字重承担，不使用衬线或斜体制造差异。
                </Body>
              </Section>

              <Section>
                {typeScale.map((t) => (
                  <div
                    key={t.token}
                    className="u-sep flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div
                        className="truncate text-ink"
                        style={{
                          fontSize: t.size,
                          lineHeight: `${t.lh}px`,
                          letterSpacing: t.ls,
                          fontWeight: t.weight,
                          fontFamily:
                            t.family === "news"
                              ? "var(--font-news)"
                              : t.family === "display"
                                ? "var(--font-display)"
                                : "var(--font-sans)",
                        }}
                      >
                        {t.sample}
                      </div>
                      <Caption className="mt-1 block">
                        {t.role} · <code className="font-mono text-[11px]">{t.cls}</code>
                      </Caption>
                    </div>
                    <span className="u-num shrink-0 text-right text-[12px] tabular-nums text-muted">
                      {t.size}/{t.lh}
                      <br />
                      {t.ls}
                    </span>
                  </div>
                ))}
              </Section>
            </div>
          </Head>

          {/* 04 */}
          <Head id="geometry" index="04" title="圆角 · 间距 · 阴影" note="GEOMETRY · 六段圆角，卡片轻落影">
            <div className="grid gap-4 lg:grid-cols-3">
              <Section title="圆角" padded>
                <div className="space-y-3">
                  {radiusTokens.map((r) => (
                    <div key={r.cls} className="flex items-center gap-3">
                      <span
                        className="bg-tint"
                        style={{ width: 34, height: 34, borderRadius: Math.min(r.px, 17) }}
                      />
                      <span className="u-num w-8 text-[12px] text-muted">{r.px}</span>
                      <code className="font-mono text-[11.5px] text-indigo">{r.cls}</code>
                      <Caption className="ml-auto text-right">{r.use}</Caption>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="间距 · 4pt" padded>
                <div className="space-y-2.5">
                  {spacing.map((s) => (
                    <div key={s.px} className="flex items-center gap-3">
                      <span className="u-num w-8 text-[12px] text-muted">{s.px}</span>
                      <span className="h-3 rounded-xs bg-indigo/70" style={{ width: s.px * 3 }} />
                      <Caption className="ml-auto">{s.use}</Caption>
                    </div>
                  ))}
                </div>
                <Divider className="my-4" />
                <Micro className="mb-2 block">固定尺寸</Micro>
                {[
                  ["屏边距", `${layout.gutter}px`],
                  ["区块之间", `${layout.sectionGap}px`],
                  ["行最小高度", `${layout.rowMin}px`],
                  ["导航条", `${layout.navH}px`],
                  ["标签栏", `${layout.tabH}px`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between py-0.5">
                    <Caption>{k}</Caption>
                    <span className="u-num text-[12px] tabular-nums text-ink-soft">{v}</span>
                  </div>
                ))}
              </Section>

              <Section title="阴影" padded>
                <div className="space-y-3">
                  {elevation.map((e) => (
                    <div key={e.cls} className={`rounded-group bg-card px-4 py-3 ${e.cls}`}>
                      <Body as="span" className="font-medium">
                        {e.name}
                      </Body>
                      <Caption className="mt-0.5 block">{e.use}</Caption>
                    </div>
                  ))}
                  <div className="u-glass rounded-group px-4 py-3">
                    <Body as="span" className="font-medium">
                      glass
                    </Body>
                    <Caption className="mt-0.5 block">毛玻璃 · 导航条 / 标签栏 / 弹层遮罩</Caption>
                  </div>
                </div>
              </Section>
            </div>
          </Head>

          {/* 05 */}
          <Head id="motion" index="05" title="动效" note="MOTION · 只做落位与弹簧">
            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <Section>
                {mt.uses.map((u) => (
                  <div key={u.name} className="u-sep flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <Body as="span" className="font-medium">
                        {u.name}
                      </Body>
                      <Caption className="mt-0.5 block">{u.where}</Caption>
                    </div>
                    <code className="shrink-0 font-mono text-[11.5px] text-indigo">{u.spec}</code>
                  </div>
                ))}
              </Section>

              <div className="space-y-4">
                <Section title="缓动与时长" padded>
                  {[
                    ["ease-ios", "cubic-bezier(.22,.61,.36,1)"],
                    ["ease-snap", "cubic-bezier(.34,1.4,.64,1)"],
                    ["fast / base / slow", "160 / 280 / 600 ms"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-3 py-1">
                      <code className="font-mono text-[12px] text-ink-soft">{k}</code>
                      <span className="u-num text-[11.5px] text-muted">{v}</span>
                    </div>
                  ))}
                  <Button className="mt-3" size="sm" variant="gray" block onClick={() => setPush((v) => !v)}>
                    重播 Push 进入
                  </Button>
                </Section>
                <Section padded className="h-[132px] overflow-hidden">
                  <ScreenTransition motionKey={push ? "a" : "b"}>
                    <div className="rounded-group bg-paper p-4">
                      <Body className="font-medium">Push · x 24 → 0</Body>
                      <Caption className="mt-1 block">280ms · ease-ios</Caption>
                    </div>
                  </ScreenTransition>
                </Section>
              </div>
            </div>
          </Head>

          {/* 06 */}
          <Head id="icons" index="06" title="图标" note="ICON · 线性 1.8pt">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <Section>
                <div className="grid grid-cols-4 gap-px bg-hair">
                  {[
                    { i: <Heart size={17} />, n: "收藏" },
                    { i: <Clock size={17} />, n: "用时" },
                    { i: <UtensilsCrossed size={17} />, n: "饮食" },
                    { i: <BookOpen size={17} />, n: "菜谱" },
                    { i: <Search size={17} />, n: "搜索" },
                    { i: <Plus size={17} />, n: "新增" },
                    { i: <Pencil size={17} />, n: "编辑" },
                    { i: <Trash2 size={17} />, n: "删除" },
                    { i: <Check size={17} />, n: "完成" },
                    { i: <ChevronRight size={17} />, n: "进入" },
                    { i: <Download size={17} />, n: "导出" },
                    { i: <Info size={17} />, n: "关于" },
                  ].map((ic) => (
                    <div
                      key={ic.n}
                      className="flex flex-col items-center gap-2 bg-card py-5 text-ink-soft"
                    >
                      {ic.i}
                      <Caption>{ic.n}</Caption>
                    </div>
                  ))}
                </div>
              </Section>
              <Section title="规则" padded>
                <ul className="space-y-2.5">
                  {icons.rules.map((r) => (
                    <li key={r} className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo" />
                      <Body tone="soft" className="leading-[1.75]">
                        {r}
                      </Body>
                    </li>
                  ))}
                </ul>
                <Divider className="my-4" />
                <div className="flex items-center gap-2">
                  <IconButton label="默认态">
                    <Heart size={17} />
                  </IconButton>
                  <IconButton label="图片上" variant="glass">
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton label="填充态" variant="fill">
                    <Trash2 size={16} />
                  </IconButton>
                  <FabButton onClick={() => setSheet(true)} label="悬浮主操作">
                    <Plus size={24} strokeWidth={2.4} />
                  </FabButton>
                </div>
              </Section>
            </div>
          </Head>

          {/* 07 */}
          <Head id="components" index="07" title="组件" note="COMPONENTS · 全部可交互">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Demo title="Button" note="6 变体 × 3 尺寸">
                <div className="space-y-2.5 p-4">
                  <Button block>主按钮 · 保存到今天</Button>
                  <Button block variant="tinted">
                    浅底按钮 · 补记一餐
                  </Button>
                  <Button block variant="gray">
                    灰底按钮 · 取消筛选
                  </Button>
                  <Button block variant="inverse">
                    反色按钮 · 开始使用
                  </Button>
                  <Button block variant="destructive">
                    破坏性 · 删除记录
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button size="sm">小号</Button>
                    <Button size="sm" variant="plain">
                      文字按钮
                    </Button>
                    <Button size="sm" loading className="flex-1">
                      保存中
                    </Button>
                  </div>
                  <Button block disabled>
                    禁用 · 先写个名字
                  </Button>
                </div>
              </Demo>

              <Demo title="Pill / Segmented" note="筛选与分段">
                <div className="space-y-4 p-4">
                  <div className="flex flex-wrap gap-2">
                    <Pill active>全部</Pill>
                    <Pill>主食</Pill>
                    <Pill>轻食</Pill>
                    <Pill tone="lake" active>
                      已备齐
                    </Pill>
                    <Pill size="sm">快手</Pill>
                  </div>
                  <Segmented
                    value={seg}
                    onChange={setSeg}
                    options={[
                      { value: "day", label: "日" },
                      { value: "week", label: "周" },
                      { value: "month", label: "月" },
                    ]}
                  />
                  <Segmented
                    size="sm"
                    value={seg}
                    onChange={setSeg}
                    options={[
                      { value: "day", label: "½ 份" },
                      { value: "week", label: "1 份" },
                      { value: "month", label: "1.5 份" },
                    ]}
                  />
                </div>
              </Demo>

              <Demo title="ListRow 附件类型" note="chevron / check / value / 控件">
                <ListRow title="进入下一级" accessory="chevron" onClick={() => undefined} />
                <ListRow
                  title="可勾选（食材）"
                  leading={<CheckCircle done={done} onClick={() => setDone((v) => !v)} />}
                  onClick={() => setDone((v) => !v)}
                />
                <ListRow title="单选（分类）" accessory="check" selected onClick={() => undefined} />
                <ListRow title="带值" value="2 次" accessory="chevron" onClick={() => undefined} />
                <ListRow
                  title="开关"
                  subtitle="20:30 提醒"
                  trailing={<Switch checked={on} onChange={setOn} label="提醒" />}
                />
                <ListRow
                  title="步进器"
                  trailing={<Stepper label="份量" value={n} onChange={setN} min={1} max={6} suffix=" 人份" />}
                />
                <ListRow title="破坏性操作" destructive onClick={() => setAlert(true)} />
                <ActionRow icon={<Plus size={16} strokeWidth={2.4} />} onClick={() => undefined}>
                  添加食材
                </ActionRow>
              </Demo>

              <Demo title="Field 输入" note="搜索 / 单行 / 多行 / 表单行">
                <div className="space-y-3 p-4">
                  <SearchField value={query} onChange={setQuery} placeholder="搜索菜谱" />
                  <div className="u-sep flex min-h-11 items-center gap-3 px-1 py-2.5">
                    <span className="w-14 shrink-0 text-body">名称</span>
                    <TextInput value={field} onChange={setField} align="left" />
                  </div>
                  <FieldRow label="份量">
                    <Stepper label="份量" value={n} onChange={setN} min={1} max={6} suffix=" 人份" />
                  </FieldRow>
                  <div className="rounded-group bg-fill px-3 py-2">
                    <TextArea value={area} onChange={setArea} rows={2} placeholder="这一步做什么？" />
                  </div>
                </div>
              </Demo>

              <Demo title="Section 容器" note="唯一容器：白卡 · 圆角 22 · 发丝描边">
                <div className="space-y-3 p-4">
                  <Section title="带标题的区块" footer="区块脚注说明">
                    <ListRow title="行一" subtitle="副文案" accessory="chevron" />
                    <ListRow title="行二" value="值" />
                  </Section>
                  <Section padded tone="tint">
                    <Body tone="accent" className="font-medium">
                      信息底 · 用于提示与强调
                    </Body>
                  </Section>
                  <div className="flex flex-wrap gap-2">
                    <Badge>默认</Badge>
                    <Badge tone="accent">蓝</Badge>
                    <Badge tone="lake">绿</Badge>
                    <Badge tone="danger">红</Badge>
                  </div>
                </div>
              </Demo>

              <Demo title="Data viz" note="环 / 条 / 计量 / 迷你柱">
                <div className="flex items-center gap-4 p-4">
                  <Ring pct={1} size={96} stroke={8}>
                    <Metric className="text-[24px]">2</Metric>
                    <Micro>次记录</Micro>
                  </Ring>
                  <div className="flex-1 space-y-3">
                    <MeterRow label="今日记录" value={2} max={2} unit="次" />
                    <MeterRow label="饮水" value={6} max={8} unit="杯" tone={color.lake} />
                    <Bar pct={42} tone={color.gold} />
                  </div>
                </div>
                <Divider />
                <div className="p-4">
                  <Sparkbars
                    values={[3, 2, 3, 1, 3, 2, 3]}
                    labels={["一", "二", "三", "四", "五", "六", "日"]}
                    tone={color.accent}
                    highlightLast
                  />
                  <div className="mt-4 grid grid-cols-3 divide-x divide-hair border-t border-hair pt-3">
                    <Stat value="17" label="本周记录" tone="accent" />
                    <Stat value="2.4" label="日均" unit=" 次" />
                    <Stat value="86" label="月完成率" unit="%" tone="lake" />
                  </div>
                </div>
              </Demo>

              <Demo title="Heatmap" note="28 天 · 真实数据 · 可点">
                <div className="p-4">
                  <Heatmap
                    values={[3, 2, 0, 1, 3, 3, 1, 2, 3, 3, 0, 2, 3, 2, 1, 0, 3, 3, 2, 3, 3, 1, 2, 3, 0, 3, 3, 3]}
                    selected="2026-09-22"
                    onSelect={() => undefined}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <Caption>22 / 28 天有记录</Caption>
                    <HeatmapLegend />
                  </div>
                </div>
              </Demo>

              <Demo title="Skeleton / EmptyState" note="加载与空态">
                <div className="space-y-3 p-4">
                  <div className="u-sep flex items-center gap-3 pb-3">
                    <Skeleton className="h-12 w-12" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-2.5 w-40" />
                    </div>
                  </div>
                  <EmptyState
                    icon={<Search size={24} strokeWidth={1.6} />}
                    title="没有匹配的菜谱"
                    description="换一个关键词，或把它记成新的一道。"
                    action={
                      <div className="flex gap-2">
                        <Button size="sm" variant="gray">
                          清除筛选
                        </Button>
                        <Button size="sm">新建菜谱</Button>
                      </div>
                    }
                  />
                </div>
              </Demo>

              <Demo title="NavBar · 范式 A/B" note="Large Title 与紧凑导航条">
                <div className="overflow-hidden bg-paper-deep">
                  <StatusBar />
                  <NavBar variant="large" largeTitle="今天" subtitle="9 月 22 日 · 星期二" />
                  <div className="px-5 pb-4">
                    <Section>
                      <ListRow title="Tab 根页面使用 Large Title" accessory="chevron" />
                    </Section>
                  </div>
                  <NavBar
                    variant="compact"
                    title="编辑菜谱"
                    backLabel=""
                    leading={
                      <span className="px-2 text-[17px] text-indigo">取消</span>
                    }
                    trailing={<span className="px-2 text-[17px] font-semibold text-indigo">完成</span>}
                  />
                  <div className="px-5 pb-4 pt-3">
                    <Caption>Push 页面使用毛玻璃紧凑导航条：返回 / 标题 / 动作</Caption>
                  </div>
                </div>
              </Demo>

              <Demo title="TabBar + FAB" note="三枚纯 Tab，主操作交给悬浮键">
                <div className="overflow-hidden bg-paper-deep pb-4">
                  <div className="flex justify-end px-5 pt-6">
                    <FabButton onClick={() => setSheet(true)} label="记一笔">
                      <Plus size={24} strokeWidth={2.4} />
                    </FabButton>
                  </div>
                  <TabBar
                    items={[
                      { value: "today", label: "今日", icon: <Clock size={icons.sizes.lg} /> },
                      { value: "recipes", label: "菜谱", icon: <BookOpen size={icons.sizes.lg} /> },
                      { value: "profile", label: "我的", icon: <Heart size={icons.sizes.lg} /> },
                    ]}
                    active={tab}
                    onSelect={setTab}
                  />
                </div>
              </Demo>

              <Demo title="Sheet / Success" note="弹层与成功态">
                <div className="space-y-3 p-4">
                  <Body tone="muted" className="leading-[1.8]">
                    弹层使用 spring(380/36) 上推，遮罩毛玻璃，标题左对齐、动作在右上或底部。
                    保存后对勾以 spring(420/18) 落下，700ms 后自动收起。
                  </Body>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setSheet(true)}>
                      打开弹层
                    </Button>
                    <Button size="sm" variant="gray" onClick={() => setSaved(true)}>
                      仅成功态
                    </Button>
                  </div>
                  <div className="relative h-[96px] overflow-hidden rounded-group bg-card">
                    <SuccessOverlay open={saved} title="已记录到今天" caption="正餐 · 1 份" />
                    {!saved ? (
                      <Caption className="absolute inset-0 flex items-center justify-center">
                        成功覆盖层占位
                      </Caption>
                    ) : null}
                  </div>
                </div>
              </Demo>

              <Demo title="Alert" note="破坏性操作的唯一确认方式">
                <div className="space-y-3 p-4">
                  <Body tone="muted" className="leading-[1.8]">
                    删除一律走 Alert，不做「再点一次确认」这类隐式二次点击。
                    确认按钮为系统红，取消为系统蓝。
                  </Body>
                  <Button size="sm" variant="destructive" onClick={() => setAlert(true)}>
                    删除这道菜谱
                  </Button>
                </div>
              </Demo>

              <Demo title="Typography" note="七个文本原语">
                <div className="space-y-3 p-4">
                  <Metric className="block text-[26px]">21</Metric>
                  <Display className="text-[26px]">今天</Display>
                  <Title className="text-[19px]">番茄牛腩饭</Title>
                  <Subhead>今日饮食</Subhead>
                  <Body>点一下，把这一餐收进来</Body>
                  <Caption>12:40 · 1 份</Caption>
                  <Micro>今日记录</Micro>
                </div>
              </Demo>

              <Demo title="BottomActionBar" note="详情页固定主操作">
                <div className="relative h-[104px] overflow-hidden bg-paper-deep">
                  <div className="absolute inset-x-0 bottom-0">
                    <BottomActionBar caption="上次做于 3 天前 · 累计 12 次">
                      <Button size="lg" block>
                        做好了，记一笔
                      </Button>
                    </BottomActionBar>
                  </div>
                </div>
              </Demo>
            </div>
          </Head>

          {/* 08 */}
          <Head id="composition" index="08" title="页面组合规范" note="COMPOSITION · 页面只做组合">
            <div className="overflow-x-auto no-scrollbar">
              <Section className="min-w-[860px]">
                <div className="u-sep grid grid-cols-[150px_110px_90px_150px_1fr] gap-4 px-4 py-3">
                  {["路由", "页面", "范式", "数据", "组合的组件"].map((h) => (
                    <Micro key={h}>{h}</Micro>
                  ))}
                </div>
                {ROUTES.map((r) => (
                  <div
                    key={r.id}
                    className="u-sep grid grid-cols-[150px_110px_90px_150px_1fr] items-start gap-4 px-4 py-3.5"
                  >
                    <code className="font-mono text-[12px] text-indigo">{r.path}</code>
                    <Body as="span" className="font-medium">
                      {r.name}
                    </Body>
                    <Caption>{r.kind}</Caption>
                    <code className="font-mono text-[11px] text-muted">{r.data}</code>
                    <span className="flex flex-wrap gap-1.5">
                      {r.uses.map((u) => (
                        <Badge key={u}>{u}</Badge>
                      ))}
                    </span>
                  </div>
                ))}
              </Section>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Section padded tone="lake">
                <Micro tone="lake">Do</Micro>
                <ul className="mt-3 space-y-2">
                  {[
                    "所有内容都装进 Section：白卡、圆角 22、1px 发丝描边、一层极轻落影",
                    "行结构统一为 前导 / 主文案 / 副文案 / 值 / 附件",
                    "蓝色只给可点元素；完成态用绿色填充",
                    "破坏性操作一律 Alert 确认",
                    "新页面先问：能否只组合已有组件完成",
                  ].map((t) => (
                    <li key={t} className="flex gap-2.5">
                      <Check size={15} className="mt-1 shrink-0 text-lake-deep" />
                      <Body tone="soft" className="leading-[1.7]">
                        {t}
                      </Body>
                    </li>
                  ))}
                </ul>
              </Section>
              <Section padded>
                <Micro>Don&apos;t</Micro>
                <ul className="mt-3 space-y-2">
                  {[
                    "不要混用卡片阴影、描边容器与全出血色带",
                    "不要在 Push 页使用 Large Title，反之亦然",
                    "不要写死 #hex、圆角、阴影或动效曲线",
                    "不要放没有真实结果的按钮或统计",
                    "不要让图标独自承担语义",
                  ].map((t) => (
                    <li key={t} className="flex gap-2.5">
                      <span className="mt-2 h-1 w-3 shrink-0 rounded-full bg-muted/50" />
                      <Body tone="soft" className="leading-[1.7]">
                        {t}
                      </Body>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>

            <Section className="mt-6">
              <ListRow
                title="返回展示台"
                subtitle="交互原型 · 路由图 · 全部页面"
                accessory="chevron"
                onClick={() => window.location.assign("/")}
              />
              <ListRow
                title="打开应用"
                subtitle="/today"
                accessory="chevron"
                onClick={() => window.location.assign("/today")}
              />
            </Section>
            <p className="mt-4 px-4">
              <Caption>
                <Link href="/" className="text-indigo">
                  展示台首页
                </Link>{" "}
                · <TrailingChevron /> 为进入下一级的统一附件
              </Caption>
            </p>
            <span className="sr-only">
              <Checkmark on={false} />
              <Card padded={false}>{null}</Card>
              <SectionHeader label="" />
              <ListGroup>{null}</ListGroup>
              <HomeIndicator />
            </span>
          </Head>
        </div>
      </div>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="记一笔"
        subtitle="今天 · 正餐"
        action={{
          label: "保存",
          onClick: () => {
            setSheet(false);
            setSaved(true);
            window.setTimeout(() => setSaved(false), 1600);
          },
        }}
        footer={
          <Button
            size="lg"
            block
            onClick={() => {
              setSheet(false);
              setSaved(true);
              window.setTimeout(() => setSaved(false), 1600);
            }}
          >
            保存到今天
          </Button>
        }
      >
        <div className="space-y-4 pb-2">
          <Segmented
            value={seg}
            onChange={setSeg}
            options={[
              { value: "day", label: "正餐" },
              { value: "week", label: "轻食" },
              { value: "month", label: "加餐" },
            ]}
          />
          <SearchField value={query} onChange={setQuery} placeholder="搜索菜谱，或直接输入" />
          <Section title="最近吃过">
            <ListRow title="番茄牛腩饭" subtitle="主食 · 90 分钟" value="12 次" />
            <ListRow title="莓果酸奶碗" subtitle="甜点 · 5 分钟" value="30 次" />
          </Section>
          <Section title="分类" footer="单选，选中显示蓝色对勾">
            {["主食", "轻食", "汤羹"].map((c) => (
              <ListRow
                key={c}
                title={c}
                accessory="check"
                selected={selected === c}
                onClick={() => setSelected(c)}
              />
            ))}
          </Section>
        </div>
        <SuccessOverlay open={saved} title="已记录到今天" caption="正餐 · 1 份" />
      </Sheet>

      <Alert
        open={alert}
        title="删除这道菜谱？"
        message="「番茄牛腩饭」将从菜谱库中移除，历史打卡记录会保留。"
        confirmLabel="删除"
        onCancel={() => setAlert(false)}
        onConfirm={() => setAlert(false)}
      />
    </div>
  );
}
