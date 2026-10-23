/**
 * Button · IconButton · FabButton · Spinner
 * ------------------------------------------------------------------
 * 与 Web 的 ds/controls.tsx 同一套 variant / size 契约。
 * Web 的 hover 态在原生换成按压态（active:），形状、颜色、字重保持一致。
 * Web 的 u-glass（backdrop-filter）在原生没有等价能力，改用半透明实色面。
 */
import { useEffect, type ReactNode } from 'react';
import { Pressable, type Insets } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { usePressFeedback } from '@/motion';
import { color, elevationStyle, layout, motion as mt } from '@/theme';

import { Icon, type IconName } from './icon';
import { Body } from './text';

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

/**
 * 触控区兜底：视觉尺寸小于 44pt 时，用 hitSlop 把可点区域补到 44pt。
 * iOS 的人机界面指南把 44×44 当作最小可靠目标，小按钮没有补偿时
 * 在真实手指下很难点中。导出给 controls / inputs 用同一套算法，
 * 不要在各自文件里写 hitSlop={6} 这类没有出处的数字。
 */
export function slopFor(width: number, height: number): Insets | undefined {
  const x = Math.max(0, Math.ceil((layout.tapMin - width) / 2));
  const y = Math.max(0, Math.ceil((layout.tapMin - height) / 2));
  if (x === 0 && y === 0) return undefined;
  return { top: y, bottom: y, left: x, right: x };
}

/* ------------------------------------------------------------------ */
/* Spinner                                                              */
/* ------------------------------------------------------------------ */
/**
 * Web 的 SVG 转圈在原生用同一份几何 + Reanimated 旋转。
 * 连续旋转属于前庭类动效：系统开了「减弱动态效果」时，
 * 换成不旋转的静止环——加载仍在表达，但不再持续转。
 */
export function Spinner({ size = 14, tone = color.card }: { size?: number; tone?: string }) {
  const reduceMotion = useReducedMotion();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      rotation.set(0);
      return;
    }
    rotation.set(
      withRepeat(withTiming(360, { duration: mt.spin * 1000, easing: Easing.linear }), -1, false)
    );
  }, [rotation, reduceMotion]);

  const animated = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.get()}deg` }] }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={animated}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke={tone}
          strokeOpacity={0.25}
          strokeWidth={3}
        />
        <Path
          d="M21 12a9 9 0 0 0-9-9"
          fill="none"
          stroke={tone}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Button                                                               */
/* ------------------------------------------------------------------ */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tonal'
  | 'tinted'
  | 'ghost'
  | 'quiet'
  | 'plain'
  | 'gray'
  | 'inverse'
  | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BTN_BOX: Record<ButtonVariant, string> = {
  primary: 'bg-indigo active:bg-indigo-deep',
  secondary: 'border border-hair bg-card active:border-indigo/50',
  tonal: 'bg-tint active:bg-fill/60',
  tinted: 'bg-tint active:bg-fill/60',
  ghost: 'border border-hair bg-card active:border-ink/30',
  quiet: 'bg-transparent',
  plain: 'bg-transparent',
  gray: 'bg-fill active:bg-fill-deep',
  inverse: 'bg-ink active:bg-ink-soft',
  destructive: 'bg-danger-tint active:bg-danger/20',
};

/** 标签颜色：Web 的 text-* 在原生由 Text 的 tone 表达 */
const BTN_TONE: Record<ButtonVariant, 'ink' | 'muted' | 'accent' | 'danger' | 'invert'> = {
  primary: 'invert',
  secondary: 'ink',
  tonal: 'accent',
  tinted: 'accent',
  ghost: 'ink',
  quiet: 'muted',
  plain: 'accent',
  gray: 'ink',
  inverse: 'invert',
  destructive: 'danger',
};

/** 加载指示器的颜色跟随标签 */
const BTN_SPINNER: Record<ButtonVariant, string> = {
  primary: color.card,
  secondary: color.ink,
  tonal: color.accent,
  tinted: color.accent,
  ghost: color.ink,
  quiet: color.muted,
  plain: color.accent,
  gray: color.ink,
  inverse: color.card,
  destructive: color.danger,
};

const BTN_SIZE: Record<ButtonSize, { box: string; label: string | undefined; h: number }> = {
  sm: { box: 'h-8 gap-1.5 rounded-full px-3.5', label: 'text-[13px]', h: 32 },
  md: { box: 'h-[42px] gap-2 rounded-full px-4.5', label: undefined, h: 42 },
  lg: { box: 'h-[50px] gap-2 rounded-full px-6', label: undefined, h: 50 },
};

/** 按钮内图标的尺寸约定：sm 用 14，其余用 17 */
export function buttonIconSize(size: ButtonSize) {
  return size === 'sm' ? ('sm' as const) : ('md' as const);
}

export type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 占满整行 */
  block?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  className?: string;
  /** 无障碍名称；文字标签存在时可省略 */
  label?: string;
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  icon,
  iconRight,
  loading = false,
  disabled = false,
  onPress,
  className,
  label,
}: ButtonProps) {
  const inert = disabled || loading;
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback(mt.pressScale.button);
  const sizing = BTN_SIZE[size];
  const leading = variant === 'plain' || variant === 'quiet' ? 'px-1' : undefined;
  // sm 只有 32pt 高：靠 hitSlop 把可点区域补到 44pt，视觉不变、手感变准
  const slop = slopFor(0, sizing.h);

  return (
    <Animated.View style={[animatedStyle, block ? { alignSelf: 'stretch' } : undefined]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: inert, busy: loading }}
        disabled={inert}
        hitSlop={slop}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={variant === 'primary' ? elevationStyle.lift : undefined}
        className={cx(
          'flex-row items-center justify-center',
          BTN_BOX[variant],
          sizing.box,
          leading,
          inert && 'opacity-40',
          className
        )}>
        {loading ? <Spinner tone={BTN_SPINNER[variant]} /> : icon}
        <Body tone={BTN_TONE[variant]} size={sizing.label} weight="font-semibold" numberOfLines={1}>
          {children}
        </Body>
        {iconRight}
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* IconButton — 圆形，四种材质                                           */
/* ------------------------------------------------------------------ */
export type IconButtonVariant = 'card' | 'glass' | 'soft' | 'fill' | 'plain' | 'invert';

const ICON_BTN_BOX: Record<IconButtonVariant, string> = {
  card: 'border border-hair bg-card active:border-indigo/50',
  /* 毛玻璃替代面：半透明纸色 */
  glass: 'border border-card/50 bg-paper/80',
  soft: 'bg-tint',
  fill: 'bg-fill active:bg-fill-deep',
  plain: 'bg-hair/60',
  invert: 'bg-ink',
};

const ICON_BTN_TONE: Record<IconButtonVariant, 'ink' | 'soft' | 'muted' | 'accent' | 'invert'> = {
  card: 'ink',
  glass: 'ink',
  soft: 'accent',
  fill: 'soft',
  plain: 'muted',
  invert: 'invert',
};

const ICON_BTN_SIZE = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-11 w-11' } as const;

/** 各尺寸的边长（pt）：越小越需要 hitSlop 兜底，而不是反过来 */
const ICON_BTN_EDGE: Record<keyof typeof ICON_BTN_SIZE, number> = { sm: 32, md: 36, lg: 44 };

export type IconButtonProps = {
  name: IconName;
  /** 无障碍名称，同时作为 tooltip 语义 */
  label: string;
  onPress?: () => void;
  variant?: IconButtonVariant;
  size?: keyof typeof ICON_BTN_SIZE;
  className?: string;
};

export function IconButton({
  name,
  label,
  onPress,
  variant = 'card',
  size = 'md',
  className,
}: IconButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback(mt.pressScale.icon);
  const edge = ICON_BTN_EDGE[size];

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        // 尺寸越小、补偿越多；lg 已经是 44pt，不再外扩
        hitSlop={slopFor(edge, edge)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className={cx(
          'shrink-0 flex-row items-center justify-center rounded-full',
          ICON_BTN_BOX[variant],
          ICON_BTN_SIZE[size],
          className
        )}>
        <Icon
          name={name}
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
          tone={ICON_BTN_TONE[variant]}
        />
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* FabButton — 右下角悬浮主操作键                                        */
/* ------------------------------------------------------------------ */
export function FabButton({
  onPress,
  label,
  children,
  className,
}: {
  onPress: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback(mt.pressScale.icon);

  return (
    <Animated.View style={[animatedStyle, elevationStyle.fab]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className={cx(
          'bg-indigo active:bg-indigo-deep h-14 w-14 flex-row items-center justify-center rounded-full',
          className
        )}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
