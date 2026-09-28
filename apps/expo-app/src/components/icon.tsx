/**
 * Icon — 唯一的图标出口
 * ------------------------------------------------------------------
 * Web 用 lucide-react，原生用 lucide-react-native，视觉语言（线性、圆头端点、
 * 1.8pt 笔画）保持一致。所有图标都必须经过这里，底层库可替换。
 */
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Camera,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  ChartColumn,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  Database,
  Eye,
  EyeOff,
  FolderTree,
  Heart,
  Info,
  LogOut,
  Minus,
  NotebookPen,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  User,
  UserRound,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react-native';

import { color, icons as iconTokens } from '@/theme';

/** 受控图标集：新增图标必须先进这张表，下游不允许直接 import lucide。 */
export const iconRegistry = {
  'arrow-down': ArrowDown,
  'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight,
  'book-open': BookOpen,
  camera: Camera,
  'calendar-check': CalendarCheck,
  'calendar-clock': CalendarClock,
  'calendar-plus': CalendarPlus,
  'chart-column': ChartColumn,
  check: Check,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'circle-alert': CircleAlert,
  clock: Clock,
  database: Database,
  eye: Eye,
  'eye-off': EyeOff,
  'folder-tree': FolderTree,
  heart: Heart,
  info: Info,
  'log-out': LogOut,
  minus: Minus,
  'notebook-pen': NotebookPen,
  pencil: Pencil,
  plus: Plus,
  search: Search,
  tags: Tags,
  'trash-2': Trash2,
  user: User,
  'user-round': UserRound,
  users: Users,
  'utensils-crossed': UtensilsCrossed,
  x: X,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconRegistry;

/** 颜色只允许这四种语义 + 两个中性档 */
export type IconTone = 'muted' | 'ink' | 'soft' | 'accent' | 'lake' | 'danger' | 'invert';
export type IconSize = keyof typeof iconTokens.sizes;

const TONE_COLOR: Record<IconTone, string> = {
  muted: color.muted,
  ink: color.ink,
  soft: color.inkSoft,
  accent: color.accent,
  lake: color.lakeDeep,
  danger: color.danger,
  invert: color.card,
};

export type IconProps = {
  name: IconName;
  size?: IconSize;
  tone?: IconTone;
  /** 与文字标签成对出现时可省略；独立出现时必填，作为无障碍名称 */
  label?: string;
  strokeWidth?: number;
  className?: string;
  /** 填充：默认不填充；收藏心形是唯一的例外 */
  fill?: 'current';
};

export function Icon({
  name,
  size = 'md',
  tone = 'muted',
  label,
  strokeWidth = iconTokens.strokeWidth,
  className,
  fill,
}: IconProps) {
  const Glyph = iconRegistry[name];
  const glyph = (
    <Glyph
      className={className}
      size={iconTokens.sizes[size]}
      color={TONE_COLOR[tone]}
      fill={fill === 'current' ? TONE_COLOR[tone] : 'none'}
      strokeWidth={strokeWidth}
    />
  );

  if (!label) return glyph;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label}>
      {glyph}
    </View>
  );
}
