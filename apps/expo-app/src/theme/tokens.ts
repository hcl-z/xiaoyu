/**
 * daily + · DESIGN TOKENS (layer 1) — Expo 原生镜像
 * ------------------------------------------------------------------
 * 与 apps/web/src/design/tokens.ts 保持同一套语义词汇，数值一一对应。
 * 两条消费路径：
 *   1. NativeWind 主题（global.css 的 @theme）——静态颜色 / 圆角 / 字号 / 阴影；
 *   2. 本文件的 TS 令牌——动画参数、原生阴影、动态样式、平台 API。
 * 下游不得自行发明数值。
 */

/* ------------------------------------------------------------------ */
/* Color                                                                */
/* ------------------------------------------------------------------ */
export const color = {
  paper: '#F2F2F7',
  paperDeep: '#E8E8ED',
  card: '#FFFFFF',
  fill: '#EBEBF0',
  fillDeep: '#DEDEE4',
  ink: '#1C1C1E',
  inkSoft: '#3A3A3C',
  muted: '#636366',
  hair: '#E5E5EA',
  accent: '#007AFF',
  accentDeep: '#0062CC',
  tint: '#EAF2FF',
  lake: '#34C759',
  lakeDeep: '#1E8A3E',
  lakeTint: '#E9F9EE',
  danger: '#FF3B30',
  dangerTint: '#FFECEB',
  gold: '#FF9500',
  goldTint: '#FFF1E0',
  goldDeep: '#B25000',
} as const;

export type ColorToken = keyof typeof color;

/** 半透明派生色。Web 用 color-mix()，原生直接给 rgba。 */
export const alpha = {
  accent28: 'rgba(0,122,255,0.28)',
  accent56: 'rgba(0,122,255,0.56)',
  ink25: 'rgba(28,28,30,0.25)',
  hair70: 'rgba(229,229,234,0.7)',
  glassLight: 'rgba(249,249,251,0.78)',
  glassDark: 'rgba(28,28,30,0.32)',
} as const;

export const colorGroups: {
  title: string;
  note: string;
  items: {
    token: string;
    themeVar: string;
    hex: string;
    name: string;
    role: string;
    onInk: boolean;
  }[];
}[] = [
  {
    title: '表面',
    note: '分组底 + 悬浮白卡，卡片带 1px 发丝描边与极轻落影',
    items: [
      {
        token: 'paper',
        themeVar: '--color-paper',
        hex: color.paper,
        name: '分组底',
        role: '全局画布',
        onInk: true,
      },
      {
        token: 'paper-deep',
        themeVar: '--color-paper-deep',
        hex: color.paperDeep,
        name: '沉底',
        role: '分区底 / 内嵌底',
        onInk: true,
      },
      {
        token: 'card',
        themeVar: '--color-card',
        hex: color.card,
        name: '卡面',
        role: '悬浮卡片 · 弹层',
        onInk: true,
      },
      {
        token: 'fill',
        themeVar: '--color-fill',
        hex: color.fill,
        name: '系统填充',
        role: '搜索框 · 未选中控件',
        onInk: true,
      },
      {
        token: 'fill-deep',
        themeVar: '--color-fill-deep',
        hex: color.fillDeep,
        name: '深填充',
        role: '分段控件轨道',
        onInk: true,
      },
      {
        token: 'hairline',
        themeVar: '--color-hair',
        hex: color.hair,
        name: '发丝线',
        role: '卡片描边 · 分隔线 · 轨道',
        onInk: true,
      },
    ],
  },
  {
    title: '文字',
    note: '三级 label，全部偏冷中性，无纯黑纯灰',
    items: [
      {
        token: 'ink',
        themeVar: '--color-ink',
        hex: color.ink,
        name: '标签黑',
        role: '标题与正文',
        onInk: false,
      },
      {
        token: 'ink-soft',
        themeVar: '--color-ink-soft',
        hex: color.inkSoft,
        name: '次级黑',
        role: '段落 · 长文',
        onInk: false,
      },
      {
        token: 'muted',
        themeVar: '--color-muted',
        hex: color.muted,
        name: '三级灰',
        role: '说明 · 元信息（白底 5.7:1）',
        onInk: false,
      },
    ],
  },
  {
    title: '强调',
    note: '一个主色一个辅助色；红只用于破坏，橙只进图表',
    items: [
      {
        token: 'indigo',
        themeVar: '--color-indigo',
        hex: color.accent,
        name: '系统蓝',
        role: '进度 · 主按钮 · 激活 · 链接',
        onInk: false,
      },
      {
        token: 'indigo-deep',
        themeVar: '--color-indigo-deep',
        hex: color.accentDeep,
        name: '系统蓝·深',
        role: '按压态',
        onInk: false,
      },
      {
        token: 'tint',
        themeVar: '--color-tint',
        hex: color.tint,
        name: '蓝浅底',
        role: '选中底色',
        onInk: true,
      },
      {
        token: 'lake',
        themeVar: '--color-lake',
        hex: color.lake,
        name: '系统绿',
        role: '完成 · 成功',
        onInk: false,
      },
      {
        token: 'lake-deep',
        themeVar: '--color-lake-deep',
        hex: color.lakeDeep,
        name: '系统绿·深',
        role: '浅底上的绿色文字',
        onInk: false,
      },
      {
        token: 'lake-tint',
        themeVar: '--color-lake-tint',
        hex: color.lakeTint,
        name: '绿浅底',
        role: '成功底色',
        onInk: true,
      },
      {
        token: 'danger',
        themeVar: '--color-danger',
        hex: color.danger,
        name: '系统红',
        role: '仅破坏性操作',
        onInk: false,
      },
      {
        token: 'gold',
        themeVar: '--color-gold',
        hex: color.gold,
        name: '系统橙',
        role: '数据第三序列',
        onInk: true,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Typography                                                           */
/* ------------------------------------------------------------------ */
/**
 * Web 的 family 字段（news / display / sans）在原生没有对应字体：
 * iOS 系统字体就是 SF Pro，Android 交给 SystemAndroid。
 * 这里保留字段是为了让 Showcase 与 Web 规格对照，渲染时一律走系统字体。
 */
export type TypeFamily = 'news' | 'display' | 'sans';
export type FontWeight = '400' | '500' | '600' | '700';

export const typeScale: {
  token: string;
  cls: string;
  size: number;
  lh: number;
  ls: number;
  weight: FontWeight;
  family: TypeFamily;
  role: string;
  sample: string;
}[] = [
  {
    token: '--text-metric',
    cls: 'text-metric',
    size: 38,
    lh: 40,
    ls: -0.02,
    weight: '600',
    family: 'news',
    role: '数值 XL · 连续天数',
    sample: '21',
  },
  {
    token: '--text-display',
    cls: 'text-display',
    size: 30,
    lh: 36,
    ls: -0.02,
    weight: '600',
    family: 'display',
    role: '大标题 · Large Title',
    sample: '今天',
  },
  {
    token: '--text-title',
    cls: 'text-title',
    size: 25,
    lh: 32,
    ls: -0.01,
    weight: '600',
    family: 'display',
    role: '页面标题 / 菜名',
    sample: '番茄牛腩饭',
  },
  {
    token: '--text-subhead',
    cls: 'text-subhead',
    size: 18,
    lh: 25,
    ls: 0,
    weight: '600',
    family: 'display',
    role: '区块标题 · 弹层标题',
    sample: '今日三餐',
  },
  {
    token: '--text-body',
    cls: 'text-body',
    size: 15,
    lh: 22,
    ls: 0,
    weight: '500',
    family: 'sans',
    role: '正文 · 列表主文案',
    sample: '点一下，把这一餐收进来',
  },
  {
    token: '--text-caption',
    cls: 'text-caption',
    size: 13,
    lh: 19,
    ls: 0,
    weight: '400',
    family: 'sans',
    role: '说明 · 元信息',
    sample: '12:40 · 1 份 · 午餐',
  },
  {
    token: '--text-micro',
    cls: 'text-micro',
    size: 11,
    lh: 14,
    ls: 0.22,
    weight: '600',
    family: 'sans',
    role: '加宽字距小标签',
    sample: '今日三餐',
  },
];

export type TypeRole = 'metric' | 'display' | 'title' | 'subhead' | 'body' | 'caption' | 'micro';

export const typeByRole: Record<TypeRole, (typeof typeScale)[number]> = {
  metric: typeScale[0],
  display: typeScale[1],
  title: typeScale[2],
  subhead: typeScale[3],
  body: typeScale[4],
  caption: typeScale[5],
  micro: typeScale[6],
};

/* ------------------------------------------------------------------ */
/* Radius · Spacing · Elevation · Layout                                */
/* ------------------------------------------------------------------ */
export const radius = {
  xs: 8,
  control: 12,
  thumb: 14,
  group: 18,
  card: 22,
  sheet: 28,
  screen: 43,
  frame: 52,
} as const;

export const radiusTokens: { cls: string; px: number; name: string; use: string }[] = [
  { cls: 'rounded-xs', px: radius.xs, name: 'xs', use: '内点 · 小色块' },
  { cls: 'rounded-control', px: radius.control, name: 'control', use: '输入域 · 小按钮' },
  { cls: 'rounded-thumb', px: radius.thumb, name: 'thumb', use: '缩略图' },
  { cls: 'rounded-group', px: radius.group, name: 'group', use: '分组列表 · 内嵌卡' },
  { cls: 'rounded-card', px: radius.card, name: 'card', use: '内容卡片' },
  { cls: 'rounded-sheet', px: radius.sheet, name: 'sheet', use: '底部弹层' },
];

export const spacing = [
  { px: 2, use: '图标与文字' },
  { px: 4, use: '紧凑堆叠' },
  { px: 8, use: '标签内边距' },
  { px: 12, use: '卡片内间距' },
  { px: 16, use: '列表内边距' },
  { px: 20, use: '屏边距' },
  { px: 24, use: '分区之间' },
  { px: 32, use: '大分区' },
];

/** 阴影阶梯：与 global.css 的 --shadow-* 同名同值 */
export type ElevationName = 'card' | 'float' | 'lift' | 'fab' | 'sheet';

export const elevation: { cls: string; name: ElevationName; use: string }[] = [
  { cls: 'shadow-card', name: 'card', use: '内容卡片 · 1px 发丝 + 落影' },
  { cls: 'shadow-float', name: 'float', use: '悬浮元素 · 弹层' },
  { cls: 'shadow-lift', name: 'lift', use: '主按钮（带色投影）' },
  { cls: 'shadow-fab', name: 'fab', use: '右下角悬浮按钮' },
  { cls: 'shadow-sheet', name: 'sheet', use: '底部弹层上缘' },
];

export const layout = {
  phoneW: 390,
  phoneH: 796,
  appMaxW: 430,
  gutter: 20,
  sectionGap: 24,
  safeBottom: 34,
  navH: 44,
  tabH: 49,
  rowMin: 44,
  tapMin: 44,
};

/* ------------------------------------------------------------------ */
/* Icons                                                                */
/* ------------------------------------------------------------------ */
export const icons = {
  strokeWidth: 1.8,
  sizes: { sm: 14, md: 17, lg: 20, xl: 24 },
  rules: [
    '线性、圆头端点、1.8pt 笔画；不填充（仅收藏态例外）',
    '尺寸只取 14 / 17 / 20 / 24 四档',
    '颜色只允许 muted（默认）、indigo（可点）、lake-deep（完成）、danger（破坏）',
    '图标必须与文字标签或 accessibilityLabel 成对出现',
  ],
};

/* ------------------------------------------------------------------ */
/* Motion                                                               */
/* ------------------------------------------------------------------ */
/**
 * Web 的 ease 是 cubic-bezier 数组（Framer Motion 用）。
 * Reanimated 的 withTiming 同样吃 [x1,y1,x2,y2]，数值原样保留。
 */
export const motion = {
  ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number],
  snap: [0.34, 1.4, 0.64, 1] as [number, number, number, number],
  /** 秒，与 Web 一致；Reanimated 的 withTiming 也以秒为单位 */
  duration: { fast: 0.18, base: 0.24, slow: 0.6 },
  /** 进度绘制：1100ms */
  draw: 1.1,
  /** 加载指示器自转一圈（Web 用 Tailwind 默认的 animate-spin 1s linear） */
  spin: 1,
  /** 骨架屏呼吸周期（Web 用 Tailwind 默认的 animate-pulse 2s） */
  pulse: 2,
  /** 逐项入场错峰 */
  stagger: { heatmap: 0.012, bars: 0.03 },
  spring: {
    sheet: { damping: 34, stiffness: 340, mass: 1 },
    segment: { damping: 38, stiffness: 480, mass: 1 },
    toggle: { damping: 36, stiffness: 560, mass: 1 },
    pop: { damping: 16, stiffness: 420, mass: 1 },
    press: { damping: 22, stiffness: 420, mass: 1 },
  },
  uses: [
    { name: 'Push 进入', spec: 'x: 26 → 0 · 240ms · ease-ios', where: '菜谱库 → 详情 / 编辑' },
    { name: 'Push 退出', spec: 'x: 0 → -18 · 240ms', where: '返回上一层' },
    { name: 'Tab 切换', spec: 'opacity 0 → 1 · 240ms', where: '今日 / 菜谱 / 我的' },
    { name: 'Sheet 上推', spec: 'y: 100% → 0 · spring(340/34)', where: '打卡弹层' },
    { name: 'Alert 弹出', spec: 'scale .86 → 1 · spring(420/16)', where: '删除确认' },
    { name: '成功对勾', spec: 'scale .4 → 1 · spring(420/16)', where: '保存成功态' },
    { name: '分段指示器', spec: '共享元素位移 · spring(480/38)', where: 'Segmented 控件' },
    { name: '进度绘制', spec: 'strokeDashoffset · 1100ms · ease-ios', where: '完成环 · 计量条' },
  ],
};

/* ------------------------------------------------------------------ */
/* Principles                                                           */
/* ------------------------------------------------------------------ */
export const principles = [
  {
    n: '01',
    t: '蓝色即可点',
    d: '遵循 iOS 语义：系统蓝只出现在可交互元素上——按钮、链接、激活态。绿色只表示完成，红色只表示破坏。',
  },
  {
    n: '02',
    t: '灰底白卡',
    d: '所有内容都住在悬浮白卡里：圆角 22、1px 发丝描边、一层极轻落影；层次靠底色差与留白，而不是重阴影。',
  },
  {
    n: '03',
    t: '系统字体 + 表格数字',
    d: '原生直接使用平台系统字体（iOS 的 SF Pro / Android 的 Roboto）；所有数字用表格数字竖向对齐。',
  },
  {
    n: '04',
    t: '只做两件事的动效',
    d: '「落位」（进入 / 揭示）与「弹簧」（拖拽 / 切换）。其余一律 200ms 内的淡入。',
  },
];
