/**
 * Data display — Stat · Ring · Bar · MeterRow · Sparkbars · Heatmap
 * ------------------------------------------------------------------
 * 与 Web 的 ds/data.tsx 同一套契约：所有数值都用表格数字。
 * Web 的 SVG strokeDashoffset 与 width% 动画在原生用 Reanimated 表达
 * （宽度/高度先测量再动画，避免依赖百分比动画）；
 * Web 的 color-mix() 换成显式 rgba 令牌。
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { stagger, useDrawProgress } from '@/motion';
import { alpha, color, motion as mt } from '@/theme';

import { Body } from './text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const easeIos = Easing.bezier(mt.ease[0], mt.ease[1], mt.ease[2], mt.ease[3]);

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ */
/* Stat                                                                 */
/* ------------------------------------------------------------------ */
export function Stat({
  value,
  label,
  unit,
  tone = 'ink',
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  unit?: string;
  tone?: 'ink' | 'accent' | 'lake';
  className?: string;
}) {
  return (
    <View className={cx('min-w-0 items-center', className)}>
      <View className="flex-row items-baseline">
        <Body
          tabular
          size="text-[24px]"
          weight="font-semibold"
          tone={tone === 'accent' ? 'accent' : tone === 'lake' ? 'lake' : 'ink'}
          numberOfLines={1}>
          {value}
        </Body>
        {unit ? (
          <Body tone="muted" size="text-caption" weight="font-normal">
            {unit}
          </Body>
        ) : null}
      </View>
      <Body
        tone="muted"
        size="text-[11px]"
        weight="font-normal"
        numberOfLines={1}
        className="mt-1.5">
        {label}
      </Body>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Ring — 进度环 · 三餐完成度                                            */
/* ------------------------------------------------------------------ */
export function Ring({
  pct,
  size = 132,
  stroke = 11,
  tone = color.accent,
  track = color.hair,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  tone?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  const progress = useDrawProgress(clamped);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - circumference * progress.get(),
  }));

  return (
    <View className="relative shrink-0" style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>
      <View className="absolute inset-0 flex-col items-center justify-center">{children}</View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Bar — 计量条                                                          */
/* ------------------------------------------------------------------ */
export function Bar({
  pct,
  tone = color.accent,
  height = 6,
  className,
}: {
  pct: number;
  tone?: string;
  height?: number;
  className?: string;
}) {
  const [width, setWidth] = useState(0);
  const clamped = Math.max(0, Math.min(100, pct));
  const target = (width * clamped) / 100;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withTiming(target, { duration: (mt.duration.slow + 0.3) * 1000, easing: easeIos })
    );
  }, [progress, target]);

  const animated = useAnimatedStyle(() => ({ width: progress.get() }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      className={cx('bg-hair/70 w-full overflow-hidden rounded-full', className)}
      style={{ height }}>
      <Animated.View
        style={[animated, { height, borderRadius: height / 2, backgroundColor: tone }]}
      />
    </View>
  );
}

/** 带标签的计量行 */
export function MeterRow({
  label,
  value,
  max,
  unit = 'g',
  tone = color.accent,
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
  tone?: string;
}) {
  return (
    <View>
      <View className="mb-1 flex-row items-baseline justify-between">
        <Body tone="muted" size="text-[11.5px]" weight="font-normal">
          {label}
        </Body>
        <Body tone="soft" size="text-[11.5px]" weight="font-normal" tabular>
          {`${value}/${max} ${unit}`}
        </Body>
      </View>
      <Bar pct={max ? (value / max) * 100 : 0} tone={tone} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkbars — 迷你柱状 · 本周节奏                                       */
/* ------------------------------------------------------------------ */
export function Sparkbars({
  values,
  labels,
  tone = color.accent,
  height = 40,
  highlightLast = false,
}: {
  values: number[];
  labels?: string[];
  tone?: string;
  height?: number;
  highlightLast?: boolean;
}) {
  const max = Math.max(...values, 1);

  return (
    <View>
      <View className="flex-row items-end gap-1" style={{ height }}>
        {values.map((v, i) => {
          const last = highlightLast && i === values.length - 1;
          return (
            <Sparkbar
              key={i}
              value={v}
              max={max}
              tone={tone}
              availableHeight={height}
              opacity={last ? 1 : v === 0 ? 0.16 : 0.3 + (v / max) * 0.55}
              delay={stagger(i, mt.stagger.bars)}
            />
          );
        })}
      </View>
      {labels ? (
        <View className="mt-1 flex-row gap-1">
          {labels.map((l, i) => {
            const last = highlightLast && i === labels.length - 1;
            return (
              <Body
                key={`${l}-${i}`}
                tone={last ? 'accent' : 'muted'}
                size="text-[10px]"
                weight={last ? 'font-semibold' : 'font-normal'}
                numberOfLines={1}
                className="flex-1 text-center">
                {l}
              </Body>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function Sparkbar({
  value,
  max,
  tone,
  availableHeight,
  opacity,
  delay,
}: {
  value: number;
  max: number;
  tone: string;
  availableHeight: number;
  opacity: number;
  delay: number;
}) {
  const target = Math.max(10, (value / max) * availableHeight);
  const height = useSharedValue(2);

  useEffect(() => {
    height.set(withDelay(delay, withTiming(target, { duration: 500, easing: easeIos })));
  }, [height, target, delay]);

  const animated = useAnimatedStyle(() => ({ height: height.get() }));

  return (
    <Animated.View
      style={[animated, { flex: 1, borderRadius: 3, backgroundColor: tone, opacity }]}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Heatmap — 打卡热力图                                                  */
/* ------------------------------------------------------------------ */
/** Web 用 color-mix(in oklab, #007AFF n%, transparent)，原生给等价的 rgba */
const HEAT_COLORS = [color.hair, alpha.accent28, alpha.accent56, color.accent] as const;

function heatColor(value: number) {
  return HEAT_COLORS[Math.max(0, Math.min(value, HEAT_COLORS.length - 1))];
}

export function Heatmap({
  values,
  days,
  selected,
  onSelect,
  weekdayLabels = ['一', '二', '三', '四', '五', '六', '日'],
}: {
  values: number[];
  days?: string[];
  selected?: string;
  onSelect?: (day: string) => void;
  weekdayLabels?: string[];
}) {
  const rows: number[][] = [];
  for (let i = 0; i < values.length; i += 7) {
    rows.push(values.slice(i, i + 7).map((_, j) => i + j));
  }

  return (
    <View>
      <View className="flex-row gap-1.5">
        {weekdayLabels.map((d) => (
          <Body
            key={d}
            size="text-[10px]"
            weight="font-normal"
            tone="muted"
            className="flex-1 text-center">
            {d}
          </Body>
        ))}
      </View>
      <View className="mt-1.5 gap-1.5">
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row gap-1.5">
            {row.map((index) => {
              const value = values[index] ?? 0;
              const day = days?.[index];
              return (
                <HeatCell
                  key={day ?? index}
                  index={index}
                  value={value}
                  day={day}
                  current={day !== undefined && day === selected}
                  onSelect={onSelect}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function HeatCell({
  index,
  value,
  day,
  current,
  onSelect,
}: {
  index: number;
  value: number;
  day?: string;
  current: boolean;
  onSelect?: (day: string) => void;
}) {
  const progress = useSharedValue(0);
  const interactive = Boolean(day && onSelect);

  useEffect(() => {
    progress.set(
      withDelay(
        stagger(index, mt.stagger.heatmap),
        withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) })
      )
    );
  }, [progress, index]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: 0.7 + 0.3 * progress.get() }],
  }));

  return (
    <Animated.View style={[animated, { flex: 1, aspectRatio: 1 }]}>
      <Pressable
        disabled={!interactive}
        accessibilityRole={interactive ? 'button' : 'image'}
        accessibilityLabel={day ? `${day}，${value} 条记录` : `${value} 条记录`}
        hitSlop={interactive ? 3 : undefined}
        onPress={day ? () => onSelect?.(day) : undefined}
        className={cx('flex-1', current && 'border-indigo border-2')}
        style={{ borderRadius: 6, backgroundColor: heatColor(value) }}
      />
    </Animated.View>
  );
}

export function HeatmapLegend({ from = '少', to = '多' }: { from?: string; to?: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Body size="text-[11px]" weight="font-normal" tone="muted">
        {from}
      </Body>
      {HEAT_COLORS.map((c) => (
        <View key={c} style={{ backgroundColor: c, width: 10, height: 10, borderRadius: 3 }} />
      ))}
      <Body size="text-[11px]" weight="font-normal" tone="muted">
        {to}
      </Body>
    </View>
  );
}
