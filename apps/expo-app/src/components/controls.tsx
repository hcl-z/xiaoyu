/**
 * Pill · Segmented · Toggle · Stepper · CheckCircle
 * ------------------------------------------------------------------
 * 与 Web 的 ds/controls.tsx 同一套契约。
 * 原生没有 hover：Web 的 hover 描边在原生变成按压描边（active:）。
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { usePressFeedback, useSegmentIndicator, useToggle } from '@/motion';
import { color, elevationStyle, hairline, radius } from '@/theme';

import { Icon } from './icon';
import { Body } from './text';

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ */
/* Pill — 筛选 chip                                                     */
/* ------------------------------------------------------------------ */
export type PillTone = 'accent' | 'lake' | 'neutral' | 'gray';

const PILL_ACTIVE: Record<PillTone, string> = {
  accent: 'border-indigo bg-indigo',
  lake: 'border-lake bg-lake',
  neutral: 'border-ink bg-ink',
  gray: 'border-ink bg-ink',
};

const PILL_IDLE: Record<PillTone, string> = {
  accent: 'border-hair bg-card active:border-indigo/40',
  lake: 'border-hair bg-card active:border-lake/40',
  neutral: 'border-hair bg-card active:border-ink/30',
  gray: 'border-hair bg-card active:border-ink/30',
};

export function Pill({
  children,
  active = false,
  tone = 'accent',
  size = 'md',
  onPress,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  tone?: PillTone;
  size?: 'sm' | 'md';
  onPress?: () => void;
  className?: string;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback(0.98);
  const classes = cx(
    'shrink-0 flex-row items-center gap-1.5 rounded-full border',
    size === 'sm' ? 'px-2.5 py-1' : 'px-3.5 py-1.5',
    active ? PILL_ACTIVE[tone] : PILL_IDLE[tone],
    className
  );

  const activeShadow = active && tone === 'accent' ? elevationStyle.lift : undefined;

  const content = (
    <Body
      tone={active ? 'invert' : 'soft'}
      size={size === 'sm' ? 'text-[12px]' : 'text-[13px]'}
      weight={active ? 'font-semibold' : 'font-medium'}
      numberOfLines={1}>
      {children}
    </Body>
  );

  if (!onPress) {
    return (
      <View className={classes} style={activeShadow}>
        {content}
      </View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, activeShadow]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={onPress}
        hitSlop={6}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className={classes}>
        {content}
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented — 共享元素指示器                                            */
/* ------------------------------------------------------------------ */
export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

/** 轨道内边距，指示器定位要减掉它 */
const TRACK_PADDING = 3;

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
  className,
}: {
  value: T;
  options: SegmentOption<T>[];
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const innerWidth = Math.max(0, trackWidth - TRACK_PADDING * 2);
  const indicatorStyle = useSegmentIndicator(index, options.length, innerWidth);

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      className={cx('border-hair/70 flex-row rounded-full border bg-black/[0.045]', className)}
      style={{ padding: TRACK_PADDING }}>
      {trackWidth > 0 ? (
        <Animated.View
          style={[
            indicatorStyle,
            elevationStyle.card,
            {
              position: 'absolute',
              left: TRACK_PADDING,
              top: TRACK_PADDING,
              bottom: TRACK_PADDING,
              width: innerWidth / options.length,
              borderRadius: radius.sheet,
              backgroundColor: color.card,
            },
          ]}
        />
      ) : null}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            className={cx(
              'flex-1 flex-row items-center justify-center gap-1.5 rounded-full',
              size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5'
            )}>
            {o.icon}
            <Body
              tone={active ? 'ink' : 'muted'}
              size="text-[13px]"
              weight={active ? 'font-semibold' : 'font-medium'}
              numberOfLines={1}>
              {o.label}
            </Body>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle — Web 的 Switch                                               */
/* ------------------------------------------------------------------ */
const TOGGLE_W = 50;
const TOGGLE_H = 30;
const KNOB = 24;
const KNOB_INSET = 3;
const KNOB_TRAVEL = TOGGLE_W - KNOB - KNOB_INSET * 2;

export function Toggle({
  checked,
  onChange,
  label,
  tone = 'lake',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  tone?: 'lake' | 'accent';
}) {
  const { knobStyle, trackStyle } = useToggle(checked, KNOB_TRAVEL, {
    off: color.hair,
    on: tone === 'lake' ? color.lake : color.accent,
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={{ width: TOGGLE_W, height: TOGGLE_H }}
      className="shrink-0 rounded-full">
      <Animated.View style={[{ flex: 1, borderRadius: TOGGLE_H / 2 }, trackStyle]} />
      <Animated.View
        style={[
          knobStyle,
          elevationStyle.card,
          {
            position: 'absolute',
            left: KNOB_INSET,
            top: KNOB_INSET,
            width: KNOB,
            height: KNOB,
            borderRadius: KNOB / 2,
            backgroundColor: color.card,
          },
        ]}
      />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Stepper                                                              */
/* ------------------------------------------------------------------ */
function StepperButton({
  name,
  label,
  disabled,
  onPress,
}: {
  name: 'minus' | 'plus';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback(0.92);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        hitSlop={6}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className={cx(
          'border-hair bg-card h-8 w-8 flex-row items-center justify-center rounded-full border',
          disabled ? 'opacity-35' : 'active:border-indigo/50'
        )}>
        <Icon name={name} size="sm" tone={disabled ? 'muted' : 'soft'} strokeWidth={2.4} />
      </Pressable>
    </Animated.View>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  suffix = '',
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <StepperButton
        name="minus"
        label={`减少${label}`}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
      />
      <Body tabular weight="font-semibold" className="min-w-[64px] text-center" numberOfLines={1}>
        {`${value}${suffix}`}
      </Body>
      <StepperButton
        name="plus"
        label={`增加${label}`}
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* CheckCircle — 完成态为系统绿填充                                       */
/* ------------------------------------------------------------------ */
export function CheckCircle({
  done,
  size = 24,
  onPress,
  label,
}: {
  done: boolean;
  size?: number;
  onPress?: () => void;
  label?: string;
}) {
  const progress = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(done ? 1 : 0, { duration: 300 }));
  }, [done, progress]);

  const circleStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [color.card, color.lake]),
    borderColor: interpolateColor(progress.get(), [0, 1], [color.hair, color.lake]),
  }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));

  const dot = (
    <Animated.View
      style={[
        circleStyle,
        {
          width: size,
          height: size,
          borderWidth: hairline,
          borderStyle: done ? 'solid' : 'dashed',
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
      <Animated.View style={checkStyle}>
        <Icon name="check" size={size <= 28 ? 'sm' : 'md'} tone="invert" strokeWidth={3} />
      </Animated.View>
    </Animated.View>
  );

  if (!onPress) return dot;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={10}
      className="shrink-0">
      {dot}
    </Pressable>
  );
}
