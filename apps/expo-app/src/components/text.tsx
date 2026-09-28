/**
 * Typography primitives — 唯一被允许设置文字的方式。
 * ------------------------------------------------------------------
 * 与 Web 的 ds/text.tsx 同一套语义角色。
 * 原生没有 DOM 元素继承：每个组件自己声明字阶与颜色，不依赖父级 Text。
 *
 * 字阶走 NativeWind 的静态 text-* utilities（global.css 定义），
 * 只有表格数字（fontVariant）走 TS 令牌——NativeWind 表达不了。
 */
import type { ReactNode } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { numeric } from '@/theme';

const nativeTextMetrics: TextStyle = { includeFontPadding: false };

export type Tone = 'ink' | 'soft' | 'muted' | 'accent' | 'lake' | 'danger' | 'invert';

const TONE_CLASS: Record<Tone, string> = {
  ink: 'text-ink',
  soft: 'text-ink-soft',
  muted: 'text-muted',
  accent: 'text-indigo',
  lake: 'text-lake-deep',
  danger: 'text-danger',
  invert: 'text-card',
};

export type BaseTextProps = {
  children?: ReactNode;
  className?: string;
  tone?: Tone;
  /** 表格数字：所有数值都要竖排对齐 */
  tabular?: boolean;
  numberOfLines?: number;
  style?: TextStyle;
  /** 无障碍语义：标题传 "header"，其余默认普通文本 */
  role?: TextProps['accessibilityRole'];
  label?: string;
  /** 覆盖字阶工具类；只在角色本身需要变体时使用（例如按钮的 sm 尺寸） */
  size?: string;
  /** 覆盖字重工具类 */
  weight?: string;
};

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

type TextBaseProps = BaseTextProps & {
  /** 字阶工具类，例如 "text-body" */
  defaultSize: string;
  /** 默认字重工具类，可被 weight 覆盖 */
  defaultWeight: string;
  /** 默认 tone，可被 tone 覆盖 */
  defaultTone?: Tone;
  extra?: string;
};

function TextBase({
  defaultSize,
  defaultWeight,
  defaultTone = 'ink',
  extra,
  children,
  className,
  tone,
  tabular,
  numberOfLines,
  style,
  role,
  label,
  size,
  weight,
}: TextBaseProps) {
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={1.15}
      numberOfLines={numberOfLines}
      accessibilityRole={role}
      accessibilityLabel={label}
      className={cx(
        size ?? defaultSize,
        weight ?? defaultWeight,
        extra,
        TONE_CLASS[tone ?? defaultTone],
        className
      )}
      style={tabular ? [nativeTextMetrics, numeric, style] : [nativeTextMetrics, style]}>
      {children}
    </Text>
  );
}

/** 38 / 40 · tabular · 大数值 */
export function Metric(props: BaseTextProps) {
  return <TextBase defaultSize="text-metric" defaultWeight="font-semibold" tabular {...props} />;
}

/** 30 / 36 · Large Title */
export function Display(props: BaseTextProps) {
  return (
    <TextBase
      defaultSize="text-display"
      defaultWeight="font-semibold"
      extra="tracking-tight"
      role="header"
      {...props}
    />
  );
}

/** 25 / 32 · 页面标题 / 菜名 */
export function Title(props: BaseTextProps) {
  return (
    <TextBase
      defaultSize="text-title"
      defaultWeight="font-semibold"
      extra="tracking-tight"
      role="header"
      {...props}
    />
  );
}

/** 18 / 25 · 区块标题 */
export function Subhead(props: BaseTextProps) {
  return (
    <TextBase
      defaultSize="text-subhead"
      defaultWeight="font-semibold"
      extra="tracking-tight"
      role="header"
      {...props}
    />
  );
}

/** 15 / 22 · 正文 */
export function Body(props: BaseTextProps) {
  return <TextBase defaultSize="text-body" defaultWeight="font-medium" {...props} />;
}

/** 13 / 19 · 说明 */
export function Caption(props: BaseTextProps) {
  return (
    <TextBase
      defaultSize="text-caption"
      defaultWeight="font-normal"
      defaultTone="muted"
      {...props}
    />
  );
}

/** 11 / 14 · 0.22em 加宽字距小标签 */
export function Micro(props: BaseTextProps) {
  return (
    <TextBase
      defaultSize="text-micro"
      defaultWeight="font-semibold"
      extra="uppercase"
      defaultTone="muted"
      {...props}
    />
  );
}

/** 柔和的编辑性文本（次级段落） */
export function Editorial(props: BaseTextProps) {
  return (
    <TextBase
      defaultSize="text-body"
      defaultWeight="font-medium"
      defaultTone="soft"
      extra="leading-relaxed"
      {...props}
    />
  );
}

/** 品牌字标：daily+ */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={1.15}
      className={cx('text-subhead text-ink font-bold tracking-tight', className)}>
      daily
      <Text
        allowFontScaling
        maxFontSizeMultiplier={1.15}
        className="text-subhead text-indigo font-bold">
        +
      </Text>
    </Text>
  );
}
