/**
 * FormRow · TextField · TextArea · SearchField
 * ------------------------------------------------------------------
 * 输入只有一种形状：**填充底 + 圆角**，与搜索框完全一致。
 *
 * 与 Web 的 ds/inputs.tsx 刻意不同——那边是「下划线 + focus-within」的表单语言；
 * 这里的行是一块自己的面，标签在左、值在右，控件本身不画任何东西。
 *
 * 状态表达（关键取舍）：**聚焦不换底色**。
 * 底色只在「默认 / 出错 / 禁用」之间变；聚焦只多一圈蓝色描边。
 * 底色随焦点变蓝会让整块行发亮，像被选中了一样，比它想表达的意思重得多。
 *   idle    填充灰 + 透明描边
 *   focus   填充灰不变 + 系统蓝描边
 *   error   淡红底 + 红描边 + 红字
 *   disabled 整体降透明度
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, TextInput, View, type KeyboardTypeOptions, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { alpha, color, hairline, motion as mt, radius } from '@/theme';

import { Icon } from './icon';
import { Body, Micro } from './text';
import { slopFor } from './button';

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

const EASE = Easing.bezier(mt.ease[0], mt.ease[1], mt.ease[2], mt.ease[3]);
const STATE_MS = 170;

/** 行高与圆角：与搜索框同一套尺寸，两类输入看上去才像一家人 */
const ROW_H = 50;
const ROW_RADIUS = radius.control;

/* ------------------------------------------------------------------ */
/* 状态与配色                                                            */
/* ------------------------------------------------------------------ */
export type RowState = 'idle' | 'focus' | 'error' | 'disabled';

/**
 * 输入行的面：**白底 + 始终可见的发丝描边**，不用深色填充。
 *
 * 为什么不用填充：页面底是 #F2F2F7，填充若取 #EBEBF0 只差 7 个色阶，
 * 整行等于没有边界；若加深到 #DEDEE4，在白卡里又会读成 disabled。
 * 白底 + 发丝边才是对比最干净、且不依赖背景色的一版。
 *
 * 聚焦只动描边（蓝），不换底色——底色一变整行会发亮，
 * 像被选中了一样，比它要表达的意思重得多。
 * 出错是唯一允许换底的情况：淡红底与红描边同时出现，
 * 因为“这行有问题”确实需要比“光标在这儿”更响的信号。
 */
const FILL: [string, string] = [color.card, color.dangerTint];
/** 描边：idle / disabled 用发丝色（看得见），聚焦转蓝、出错转红 */
const EDGE_IDLE = color.hair;
const BORDER_FOCUS: [string, string] = [EDGE_IDLE, color.accent];
const BORDER_ERROR: [string, string] = [EDGE_IDLE, color.danger];

/**
 * 单行输入框的文字度量。
 *
 * iOS 上光靠外层的 `items-center` 是**不够**的：TextInput 自己会先把文字
 * 在它的固有高度里排一遍，而固有高度是字体 ascend/descend 算出来的，
 * 跟 lineHeight 不一定相等。结果就是：外层明明居中了，里面的字却偏上或偏下。
 *
 * 所以这里把三件事同时钉死：
 *   - lineHeight = 行内文字的行盒高（与 text-body 的 22 对齐）
 *   - height      = 同一个值，让输入框在 iOS 上也有确定的高度
 *   - paddingVertical = 0，不让 iOS 再叠一层内部留白
 * includeFontPadding 是 Android 专有，iOS 忽略，但写上不影响。
 */
const LINE_BOX = 22;
export const INPUT_METRICS: TextStyle = {
  includeFontPadding: false,
  lineHeight: LINE_BOX,
  height: LINE_BOX,
  paddingVertical: 0,
  paddingHorizontal: 0,
  /* iOS 上 TextInput 默认会把自己的文字块在高度里居中；
     固定高度 + 无内边距后，这个标题就与同一行里的图标/文字基线一致了 */
  textAlignVertical: 'center',
};

/* ------------------------------------------------------------------ */
/* FormRow — 一行的填充面                                                */
/* ------------------------------------------------------------------ */
export function FormRow({
  label,
  state = 'idle',
  leading,
  trailing,
  onPress,
  disabled = false,
  children,
  className,
  layout = 'inline',
}: {
  label?: string;
  state?: RowState;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** 给了 onPress 就整行可点（选择行 / 跳转行） */
  onPress?: () => void;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  /**
   * 标签位置：
   *  - 'inline'（默认）标签在左、值在右——独立字段的常规形态
   *  - 'stacked' 标签在框内上方、值在下——横向空间紧、
   *    或需要标签始终盯着自己的值时用（如封面旁边的名称/备注）
   */
  layout?: 'inline' | 'stacked';
}) {
  const reduceMotion = useReducedMotion();
  const effective: RowState = disabled ? 'disabled' : state;
  const stacked = layout === 'stacked';

  // 底色与描边分开驱动：聚焦不碰底色，出错才碰
  const fillTarget = effective === 'error' ? 1 : 0;
  const borderTarget = effective === 'focus' || effective === 'error' ? 1 : 0;
  const fill = useSharedValue(fillTarget);
  const border = useSharedValue(borderTarget);

  useEffect(() => {
    const ms = reduceMotion ? 0 : STATE_MS;
    fill.set(withTiming(fillTarget, { duration: ms, easing: EASE }));
    border.set(withTiming(borderTarget, { duration: ms, easing: EASE }));
  }, [fill, border, fillTarget, borderTarget, reduceMotion]);

  const surface = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(fill.get(), [0, 1], FILL),
    borderColor: interpolateColor(
      border.get(),
      [0, 1],
      effective === 'error' ? BORDER_ERROR : BORDER_FOCUS
    ),
  }));

  const labelNode = label ? (
    stacked ? (
      <Micro tone={effective === 'error' ? 'danger' : 'muted'} numberOfLines={1}>
        {label}
      </Micro>
    ) : (
      <Body
        tone={effective === 'error' ? 'danger' : 'muted'}
        weight="font-normal"
        numberOfLines={1}
        className="shrink-0">
        {label}
      </Body>
    )
  ) : null;

  const inner = stacked ? (
    <Animated.View
      style={[
        surface,
        {
          borderRadius: ROW_RADIUS,
          borderWidth: hairline,
          paddingHorizontal: 14,
          paddingVertical: 7,
        },
      ]}
      className="w-full">
      {labelNode}
      <View className="mt-0.5 min-w-0 flex-row items-center gap-2">
        {leading}
        {children}
        {trailing}
      </View>
    </Animated.View>
  ) : (
    <Animated.View
      style={[surface, { height: ROW_H, borderRadius: ROW_RADIUS, borderWidth: hairline }]}
      className={cx('w-full flex-row items-center gap-3 px-3.5', className)}>
      {leading}
      {labelNode}
      <View className="min-w-0 flex-1 flex-row items-center justify-end gap-2">{children}</View>
      {trailing}
    </Animated.View>
  );

  if (!onPress) return <View className={cx('w-full', disabled && 'opacity-45')}>{inner}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      /* 整行可点时用中性灰按压，不用浅蓝——蓝色只属于“可点”的标识，
         不适合当“刚被按住”的反馈，否则整页点哪都泛蓝。 */
      className={cx('w-full', disabled ? 'opacity-45' : 'active:bg-fill/60')}>
      {inner}
    </Pressable>
  );
}

/** 行与行之间的间距：由容器统一给，行自己不写外边距 */
export function FormGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={cx('px-5', className)} style={{ rowGap: 10 }}>
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* TextField                                                            */
/* ------------------------------------------------------------------ */
/** Web 的 inputMode 在原生映射到 keyboardType */
const KEYBOARD: Record<'text' | 'numeric' | 'decimal' | 'email', KeyboardTypeOptions> = {
  text: 'default',
  numeric: 'number-pad',
  decimal: 'decimal-pad',
  email: 'email-address',
};

export type TextFieldProps = {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  /** 值靠左还是靠右；行内右侧是默认 */
  align?: 'right' | 'left';
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email';
  autoFocus?: boolean;
  editable?: boolean;
  /**
   * 密码等敏感输入：字符隐藏，并顺带关掉自动大写与自动纠错。
   * 邮箱靠 inputMode="email" 拿到同一套处理，不用再手写键盘类型。
   */
  secure?: boolean;
  error?: boolean;
  maxLength?: number;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** 附加到行容器上的工具类，用于个别行的宽度/间距微调 */
  className?: string;
  /** 标签位置：见 FormRow 的 layout */
  layout?: 'inline' | 'stacked';
  onBlur?: () => void;
  /**
   * 递增的聚焦信号：值每变一次就把光标送进输入框。
   * 用于行外的动作按钮把焦点交回输入行，而不必向上暴露 ref。
   */
  focusSignal?: number;
  /** 键盘回车提交。提交后输入框保持聚焦，方便连续添加多项 */
  onSubmit?: () => void;
  /**
   * 内联密集行：不画输入行的框与标签，只留一个裸输入框。
   * 用在「食材 / 用量」这类一行里两个输入、外层已经是一个分组卡的地方——
   * 再给每个输入套一层白底描边框，一行会变成四个框，反而看不清。
   * 内联行的可点性由外层 Section / 同行相邻的控件承担。
   */
  inline?: boolean;
};

export function TextField({
  value,
  onChange,
  label,
  placeholder,
  align = 'right',
  inputMode,
  autoFocus,
  editable = true,
  secure,
  error = false,
  maxLength,
  leading,
  trailing,
  className,
  onBlur,
  focusSignal,
  onSubmit,
  inline = false,
  layout,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!focusSignal) return;
    inputRef.current?.focus();
  }, [focusSignal]);

  const state: RowState = !editable ? 'disabled' : error ? 'error' : focused ? 'focus' : 'idle';

  const input = (
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={error ? alpha.dangerPlaceholder : alpha.placeholder}
      keyboardType={inputMode ? KEYBOARD[inputMode] : undefined}
      autoFocus={autoFocus}
      editable={editable}
      secureTextEntry={secure}
      maxLength={maxLength}
      selectionColor={color.accent}
      autoCapitalize={secure || inputMode === 'email' ? 'none' : undefined}
      autoCorrect={secure || inputMode === 'email' ? false : undefined}
      accessibilityLabel={label ?? placeholder}
      accessibilityState={{ disabled: !editable }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      returnKeyType={onSubmit ? 'done' : undefined}
      submitBehavior={onSubmit ? 'submit' : undefined}
      onSubmitEditing={onSubmit}
      className={cx(
        'text-body min-w-0 flex-1',
        error ? 'text-danger' : 'text-ink',
        value ? 'font-medium' : 'font-normal',
        /* inline 模式下 className 落到输入框本身（非 inline 时它属于外层行容器）；
           不能让传进来的 prop 静默失效 */
        inline && className
      )}
      style={[INPUT_METRICS, { textAlign: align }, inline && !editable ? { opacity: 0.45 } : null]}
    />
  );

  if (inline) return input;

  return (
    <FormRow
      label={label}
      state={state}
      layout={layout}
      leading={leading}
      trailing={trailing}
      className={className}>
      {input}
    </FormRow>
  );
}

/* ------------------------------------------------------------------ */
/* TextArea                                                             */
/* ------------------------------------------------------------------ */
export function TextArea({
  value,
  onChange,
  label,
  placeholder,
  rows = 3,
  maxLength,
  autoFocus,
  editable = true,
  error = false,
  bare = false,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  autoFocus?: boolean;
  editable?: boolean;
  error?: boolean;
  /** 裸文本域：不套输入行的框。用于步骤这类「外层已经是卡片、旁边已有序号」的行 */
  bare?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [height, setHeight] = useState(0);
  const minHeight = 22 * rows;
  const state: RowState = !editable ? 'disabled' : error ? 'error' : focused ? 'focus' : 'idle';

  const input = (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={error ? alpha.dangerPlaceholder : alpha.placeholder}
      multiline
      autoFocus={autoFocus}
      editable={editable}
      maxLength={maxLength}
      selectionColor={color.accent}
      accessibilityLabel={label ?? placeholder}
      accessibilityState={{ disabled: !editable }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      // 先按内容量一次，再把最终高度交给 style；下限是 rows 行
      onContentSizeChange={(e) => {
        const next = Math.max(minHeight, e.nativeEvent.contentSize.height);
        setHeight((prev) => (Math.abs(prev - next) < 1 ? prev : next));
      }}
      className={cx('text-body w-full', error ? 'text-danger' : 'text-ink')}
      style={{ includeFontPadding: false, height: height || minHeight, textAlignVertical: 'top' }}
    />
  );

  if (bare) return input;

  return (
    <FormRow label={label} state={state}>
      {input}
    </FormRow>
  );
}

/* ------------------------------------------------------------------ */
/* SearchField — 与上面的行同一套形状                                     */
/* ------------------------------------------------------------------ */
export function SearchField({
  value,
  onChange,
  placeholder = '搜索',
  onSubmit,
  autoFocus,
  editable = true,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  editable?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withTiming(focused ? 1 : 0, { duration: reduceMotion ? 0 : STATE_MS, easing: EASE })
    );
  }, [progress, focused, reduceMotion]);

  // 只动描边，不动底色——与输入行同一条规则
  const border = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.get(), [0, 1], BORDER_FOCUS),
  }));

  return (
    <Animated.View
      style={[
        border,
        // 与输入行同一张面：白底 + 发丝边，不用深色填充
        { backgroundColor: color.card, borderRadius: ROW_RADIUS, borderWidth: hairline },
      ]}
      className={cx(
        'min-h-[44px] flex-row items-center gap-2 px-3.5 py-2.5',
        !editable && 'opacity-45',
        className
      )}>
      <Icon name="search" size="sm" tone={focused ? 'accent' : 'muted'} />
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={() => onSubmit?.()}
        returnKeyType="search"
        placeholder={placeholder}
        placeholderTextColor={alpha.placeholderSoft}
        autoFocus={autoFocus}
        editable={editable}
        selectionColor={color.accent}
        accessibilityLabel={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="text-body text-ink min-w-0 flex-1"
        style={INPUT_METRICS}
      />
      <ClearButton visible={value.length > 0} onPress={() => onChange('')} />
    </Animated.View>
  );
}

function ClearButton({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(visible ? 1 : 0, { duration: reduceMotion ? 0 : 160 }));
  }, [progress, visible, reduceMotion]);

  const animated = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: p,
      transform: [{ scale: mt.pressScale.chip + (1 - mt.pressScale.chip) * p }],
    };
  });

  // 收起后不再吃点击：用 pointerEvents 而不是条件挂载，动画才播得完
  return (
    <Animated.View style={animated} pointerEvents={visible ? 'auto' : 'none'}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="清除"
        accessibilityElementsHidden={!visible}
        importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
        onPress={onPress}
        hitSlop={slopFor(18, 18)}
        className="shrink-0 active:opacity-60">
        <View className="bg-muted/40 h-4.5 w-4.5 items-center justify-center rounded-full">
          <Icon name="x" size="sm" tone="invert" strokeWidth={3} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* FieldError — 表单级错误提示                                           */
/* ------------------------------------------------------------------ */
/** 行下方的整行红字。比挤在行尾更易读，也放得下稍长的说明 */
export function FieldError({ children }: { children: ReactNode }) {
  return (
    <View className="flex-row items-start gap-1.5 px-5 pt-1.5">
      <Icon name="circle-alert" size="sm" tone="danger" />
      <Body tone="danger" size="text-[13px]" className="min-w-0 flex-1 leading-snug">
        {children}
      </Body>
    </View>
  );
}
