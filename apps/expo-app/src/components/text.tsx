/**
 * Typography primitives — 唯一被允许设置文字的方式。
 * ------------------------------------------------------------------
 * 与 Web 的 ds/text.tsx 同一套语义角色。
 * 原生没有 DOM 元素继承：每个组件自己声明字阶与颜色，不依赖父级 Text。
 *
 * 字阶走 NativeWind 的静态 text-* utilities（global.css 定义），
 * 只有表格数字（fontVariant）与动态字体的上限走 TS——NativeWind 表达不了。
 */
import type { ReactNode } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { numeric } from '@/theme';

const nativeTextMetrics: TextStyle = { includeFontPadding: false };

/* ------------------------------------------------------------------ */
/* 动态字体 · Dynamic Type                                              */
/* ------------------------------------------------------------------ */
/**
 * 1. 动态字体是系统级可访问设置，不能被随手封顶。
 *    正文放到 1.6；大字号标题放到 1.3——标题本身已经很大，再放大会先把版面
 *    撑破，iOS 自己的大标题也比正文收敛。
 * 2. allowFontScaling 全字号开启，用户在小屏 + 大字下仍能读完一句话。
 */
const SCALE_BODY = 1.6;
const SCALE_TITLE = 1.3;

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

/**
 * 标签里是不是只有西文（含数字与常见标点）。
 * Micro 的 0.22em 字距是为拉丁大写小标签设计的；中文没有大小写，
 * 且在汉字之间拉开 2.42px 会让标签看起来散架，所以只对西文加宽字距。
 */
const CJK = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;

function isLatinOnly(children: ReactNode): boolean {
  if (typeof children === 'string') return children.length > 0 && !CJK.test(children);
  if (Array.isArray(children)) return children.every(isLatinOnly);
  return false;
}

type TextBaseProps = BaseTextProps & {
  /** 字阶工具类，例如 "text-body" */
  defaultSize: string;
  /** 默认字重工具类，可被 weight 覆盖 */
  defaultWeight: string;
  /** 默认 tone，可被 tone 覆盖 */
  defaultTone?: Tone;
  extra?: string;
  /** 动态字体上限：正文 1.6，标题 1.3 */
  scale?: number;
};

function TextBase({
  defaultSize,
  defaultWeight,
  defaultTone = 'ink',
  extra,
  scale = SCALE_BODY,
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
      maxFontSizeMultiplier={scale}
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
  return (
    <TextBase
      defaultSize="text-metric"
      defaultWeight="font-semibold"
      scale={SCALE_TITLE}
      tabular
      {...props}
    />
  );
}

/** 30 / 36 · Large Title */
export function Display(props: BaseTextProps) {
  return (
    <TextBase
      defaultSize="text-display"
      defaultWeight="font-semibold"
      extra="tracking-tight"
      scale={SCALE_TITLE}
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
      scale={SCALE_TITLE}
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
      scale={SCALE_TITLE}
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

/**
 * 11 / 14 · 小标签。
 * 字距与大小写只对西文成立：`uppercase` 对中文是空操作，
 * 0.22em 字距在中西文之间会跳着变，所以两者都跟着内容走。
 */
export function Micro({ children, className, size, tabular, style, ...rest }: BaseTextProps) {
  const latin = isLatinOnly(children);
  return (
    <TextBase
      defaultSize="text-micro"
      defaultWeight="font-semibold"
      defaultTone="muted"
      extra={latin ? 'uppercase' : undefined}
      /*
       * text-micro 自带 0.22em 字距（为拉丁大写小标签设计），中文用不上。
       * 这里只用一个来源把它收回：行内 style 直接覆盖 utility 的 letter-spacing，
       * 不再同时往 size 槽里塞一个 tracking 类——两条来源会互相打架，
       * 而且 size 是字阶槽，塞字距类名本身就是错位。
       * style 显式解构并放在最后合并，避免调用方传 style 时把这里抹掉。
       */
      style={latin ? style : { ...style, letterSpacing: 0 }}
      size={size}
      tabular={tabular}
      {...rest}>
      {children}
    </TextBase>
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

/** 品牌字标：daily+（全拉丁，字距与大小写不涉中文） */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={SCALE_TITLE}
      className={cx('text-subhead text-ink font-bold tracking-tight', className)}>
      daily
      <Text
        allowFontScaling
        maxFontSizeMultiplier={SCALE_TITLE}
        className="text-subhead text-indigo font-bold">
        +
      </Text>
    </Text>
  );
}
