/**
 * Surfaces · List · Badge · EmptyState
 * ------------------------------------------------------------------
 * 与 Web 的 ds/surfaces.tsx 同一套契约：分组画布 + 悬浮白卡。
 * Web 的伪元素分隔线（u-sep）在原生换成真实的 1px 视图；
 * Web 的 hover 行底色换成按压行底色（active:）。
 */
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { StaggerItem, usePressFeedback } from '@/motion';
import { alpha, color, elevationStyle, hairline, layout, motion as mt, radius } from '@/theme';

import { Icon } from './icon';
import { Body, Caption, Micro } from './text';

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ */
/* Surfaces — floating hairline cards                                   */
/* ------------------------------------------------------------------ */
export type SurfaceTone = 'card' | 'deep' | 'fill' | 'accent' | 'tint' | 'lake';

const SURFACE_TONE: Record<SurfaceTone, string> = {
  card: 'bg-card border-hair/80',
  deep: 'bg-paper-deep border-hair/70',
  fill: 'bg-fill border-hair/60',
  accent: 'bg-tint border-indigo/25',
  tint: 'bg-tint border-indigo/25',
  lake: 'bg-lake-tint border-lake/25',
};

/**
 * 悬浮白卡。
 *
 * 为什么是两层视图：Web 上 overflow:hidden 不会裁掉自身的 box-shadow，
 * iOS 上 masksToBounds 会——同一层写这两样，落影就没了。
 * 所以外层负责圆角、描边与落影，内层负责把子内容裁到圆角内。
 */
export function Card({
  children,
  className,
  padded = true,
  tone = 'card',
  style,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  tone?: SurfaceTone;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      className={cx('rounded-card border', SURFACE_TONE[tone], className)}
      style={[elevationStyle.card, style]}>
      {/* grow 而不是 flex-1：父级自动高度时不吃掉内容高度，父级定高时才撑满 */}
      <View className={cx('rounded-card grow overflow-hidden', padded && 'p-5')}>{children}</View>
    </View>
  );
}

/** 页面唯一的容器：卡片 + 可选小标题 + 可选脚注 */
export function Section({
  title,
  footer,
  children,
  padded = false,
  tone = 'card',
  className,
}: {
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  padded?: boolean;
  tone?: SurfaceTone;
  className?: string;
}) {
  return (
    <View className={className}>
      {title ? (
        <View className="mb-2 flex-row items-baseline justify-between gap-3 px-1">
          {typeof title === 'string' ? <Micro>{title}</Micro> : title}
        </View>
      ) : null}
      <Card padded={padded} tone={tone}>
        {children}
      </Card>
      {footer ? (
        <View className="mt-2 px-1">
          {typeof footer === 'string' ? <Caption>{footer}</Caption> : footer}
        </View>
      ) : null}
    </View>
  );
}

export function SectionHeader({
  label,
  title,
  trailing,
  className,
}: {
  label?: string;
  title?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <View className={cx('mb-2 flex-row items-baseline justify-between gap-3 px-1', className)}>
      <View className="min-w-0 flex-row items-baseline gap-2.5">
        {label ? <Micro>{label}</Micro> : null}
        {title}
      </View>
      {trailing}
    </View>
  );
}

export function Divider({ className }: { className?: string }) {
  return <View className={cx('bg-hair', className)} style={{ height: hairline }} />;
}

/** 分组列表：圆角 18，描边，行间发丝线由 ListRow 自带 */
export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
  const items = Children.toArray(children);
  return (
    <View className={cx('rounded-group border-hair/70 bg-card overflow-hidden border', className)}>
      {items.map((child, index) =>
        isValidElement(child)
          ? cloneElement(child as ReactElement<{ separator?: boolean }>, {
              separator: index < items.length - 1,
            })
          : child
      )}
    </View>
  );
}

export type Accessory = 'chevron' | 'check' | 'none';

/**
 * 把列表行里的文字拼成一句话。
 * 原生只会把行内第一段文字交给读屏，副标题、备注和右侧数值全都读不到，
 * 所以行的朗读文案由这里自己拼；拼不出来（遇到非文本节点）就返回 null，
 * 交回系统默认行为。
 */
function plainText(node: ReactNode): string | null {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) {
    const parts: string[] = [];
    for (const child of node) {
      const part = plainText(child);
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  }
  if (isValidElement(node)) {
    return plainText((node.props as { children?: ReactNode }).children);
  }
  return null;
}

export function ListRow({
  leading,
  title,
  subtitle,
  note,
  value,
  trailing,
  accessory = 'none',
  onPress,
  destructive = false,
  selected = false,
  label,
  className,
  /**
   * 错峰入场的序号。列表换批（筛选、搜索）时由调用方从 0 开始编号，
   * 行自己完成落位——这样 ListGroup 的「非最后一行画分隔线」仍然成立，
   * 因为每一行仍是 ListGroup 的直接子节点。传入即启用。
   */
  staggerIndex,
  /** 换批身份；变化时重播错峰。通常传筛选条件字符串 */
  staggerKey,
  /** 由 ListGroup 注入：非最后一行画分隔线 */
  separator = false,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /**
   * 副标题下面的一段正文。列表行默认只给一行副标题，装不下用户自己写下的
   * 心得；这里给到三行，再长就交给点进去的那一页。
   */
  note?: ReactNode;
  value?: ReactNode;
  trailing?: ReactNode;
  accessory?: Accessory;
  onPress?: () => void;
  destructive?: boolean;
  selected?: boolean;
  /** 朗读文案的兜底覆盖；默认由 title / subtitle / note / value 拼出来 */
  label?: string;
  className?: string;
  staggerIndex?: number;
  staggerKey?: string | number;
  separator?: boolean;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback(mt.pressScale.block);
  const inset = leading ? 56 : 16;
  const spoken = [title, subtitle, note, value].map(plainText);
  const composed = spoken.every((part) => part !== null) ? spoken.filter(Boolean).join('，') : '';
  const spokenLabel = label ?? (composed || undefined);

  const content = (
    <>
      {leading ? <View className="shrink-0 flex-row items-center">{leading}</View> : null}
      <View className="min-w-0 flex-1">
        <Body
          numberOfLines={1}
          tone={destructive ? 'danger' : selected ? 'accent' : 'ink'}
          weight={destructive || selected ? 'font-semibold' : 'font-medium'}>
          {title}
        </Body>
        {subtitle ? (
          <Caption numberOfLines={1} className="mt-0.5">
            {subtitle}
          </Caption>
        ) : null}
        {note ? (
          <Caption tone="soft" numberOfLines={3} className="mt-1 leading-relaxed">
            {note}
          </Caption>
        ) : null}
      </View>
      {value ? (
        <Caption numberOfLines={1} className="shrink-0">
          {value}
        </Caption>
      ) : null}
      {trailing}
      {accessory === 'chevron' && !trailing ? <TrailingChevron /> : null}
      {accessory === 'check' && !trailing ? <Checkmark on={selected} /> : null}
    </>
  );

  const body = (
    <View
      className={cx('w-full flex-row items-center gap-3 px-4', className)}
      // 与 FormRow 同一行高：同一屏里的列表行与输入行不该差一截
      style={{ minHeight: layout.rowMin, paddingVertical: 10 }}>
      {content}
      {separator ? (
        <View
          className="bg-hair absolute right-0 bottom-0"
          style={{ left: inset, height: hairline }}
        />
      ) : null}
    </View>
  );

  if (!onPress) return body;

  const interactive = (
    <Animated.View style={animatedStyle}>
      <Pressable
        className="active:bg-fill/60 w-full"
        accessibilityRole="button"
        accessibilityLabel={spokenLabel}
        accessibilityState={{ selected }}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
        {body}
      </Pressable>
    </Animated.View>
  );

  // 错峰入场：key 变了就重挂载，让换批后的列表从第 0 项重新铺开
  if (staggerIndex !== undefined) {
    return (
      <StaggerItem key={staggerKey} index={staggerIndex}>
        {interactive}
      </StaggerItem>
    );
  }

  return interactive;
}

/** 卡片内的蓝色文字动作行 */
export function ActionRow({
  children,
  onPress,
  destructive = false,
  icon,
  disabled = false,
  separator = false,
}: {
  children: ReactNode;
  onPress: () => void;
  destructive?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
  separator?: boolean;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback(mt.pressScale.block);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className={cx(
          'min-h-11 w-full flex-row items-center justify-center gap-2 px-4 py-3',
          !disabled && 'active:bg-fill/60',
          disabled && 'opacity-35'
        )}>
        {icon}
        <Body tone={destructive ? 'danger' : 'accent'} weight="font-semibold">
          {children}
        </Body>
        {separator ? (
          <View className="bg-hair absolute right-0 bottom-0 left-0" style={{ height: hairline }} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function TrailingChevron() {
  return <Icon name="chevron-right" size="md" tone="muted" className="shrink-0 opacity-70" />;
}

/**
 * 单选行右侧的蓝色对勾。
 * 选中 / 取消都要有过程：挂载时淡入而非硬出，配合行自身的状态切换。
 */
export function Checkmark({ on }: { on: boolean }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(on ? 1 : 0, { duration: reduceMotion ? 0 : 160 }));
  }, [progress, on, reduceMotion]);

  const animated = useAnimatedStyle(() => ({ opacity: progress.get() }));

  // 未选中时不再占据可访问性焦点——空视图对读屏没有意义
  return (
    <Animated.View
      style={animated}
      className="shrink-0"
      accessibilityElementsHidden={!on}
      importantForAccessibility={on ? 'auto' : 'no-hide-descendants'}>
      <Icon name="check" size="md" tone="accent" strokeWidth={2.4} />
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                                */
/* ------------------------------------------------------------------ */
export type BadgeTone = 'gray' | 'outline' | 'accent' | 'lake' | 'gold' | 'ink' | 'danger';

const BADGE_TONE: Record<
  BadgeTone,
  { box: string; text: 'ink' | 'soft' | 'muted' | 'accent' | 'lake' | 'danger' | 'invert' }
> = {
  gray: { box: 'bg-hair/60', text: 'soft' },
  outline: { box: 'border border-hair', text: 'muted' },
  accent: { box: 'bg-tint', text: 'accent' },
  lake: { box: 'bg-lake-tint', text: 'lake' },
  gold: { box: 'bg-gold-tint', text: 'ink' },
  ink: { box: 'bg-ink', text: 'invert' },
  danger: { box: 'bg-danger-tint', text: 'danger' },
};

/** 金色徽标在 Web 用 #FFF1E0 / #B25000，原生同样走令牌 */
const BADGE_TEXT_STYLE: Partial<Record<BadgeTone, { color: string }>> = {
  gold: { color: color.goldDeep },
};

export function Badge({
  children,
  tone = 'gray',
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <View
      className={cx(
        'shrink-0 flex-row items-center gap-1 self-start rounded-full px-2.5 py-0.5',
        BADGE_TONE[tone].box,
        className
      )}>
      <Body
        tone={BADGE_TONE[tone].text}
        size="text-[11.5px]"
        weight="font-semibold"
        numberOfLines={1}
        style={BADGE_TEXT_STYLE[tone]}>
        {children}
      </Body>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton · EmptyState                                                */
/* ------------------------------------------------------------------ */
/**
 * Web 的 animate-pulse 在原生用 Reanimated 呼吸。
 * 持续脉动在前庭上比一次性动画更敏感：开了「减弱动态效果」时
 * 换成静止占位块，骨架屏的「正在加载」语义不靠呼吸保留。
 */
export function Skeleton({
  className,
  rounded = radius.control,
  height,
}: {
  className?: string;
  rounded?: number;
  height?: number;
}) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      opacity.set(0.7);
      return;
    }
    opacity.set(
      withRepeat(
        withTiming(0.45, { duration: (mt.pulse * 1000) / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [opacity, reduceMotion]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  // Animated.View 不受 NativeWind 接管：底色走令牌，宽度等版式交给外层 className
  return (
    <View className={className}>
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[animated, { borderRadius: rounded, height, backgroundColor: alpha.hair70 }]}
      />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View className="rounded-card border-hair bg-card/60 flex-col items-center gap-3 border border-dashed px-6 py-10">
      {icon ? (
        <View className="bg-tint h-11 w-11 flex-row items-center justify-center rounded-full">
          {icon}
        </View>
      ) : null}
      <Body weight="font-semibold" className="text-center">
        {title}
      </Body>
      {description ? (
        <Caption className="max-w-[240px] text-center leading-relaxed">{description}</Caption>
      ) : null}
      {action ? (
        <View className="mt-1 flex-row flex-wrap justify-center gap-2">{action}</View>
      ) : null}
    </View>
  );
}
