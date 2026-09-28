/**
 * daily + · MOTION PRIMITIVES (layer 1.5)
 * ------------------------------------------------------------------
 * Web 的动效词汇只有两件事：「落位」（进入 / 揭示）与「弹簧」（拖拽 / 切换）。
 * 这里把 Framer Motion 的概念换成 Reanimated 的 Animated 视图、shared value、
 * withTiming / withSpring 与布局过渡——参数一律来自 @/theme 的 motion 令牌，
 * 组件内部不允许再写死时长或弹簧。
 *
 * 约定：NativeWind 只接管 react-native 的核心组件，不接管 Animated.View，
 * 因此动画容器一律用 style（令牌派生），className 交给内部的核心组件。
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn as ReanimatedFadeIn,
  FadeOut as ReanimatedFadeOut,
  interpolate,
  interpolateColor,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { motion as mt } from '@/theme';

/* ------------------------------------------------------------------ */
/* 基础工具                                                             */
/* ------------------------------------------------------------------ */
const easeIos = Easing.bezier(mt.ease[0], mt.ease[1], mt.ease[2], mt.ease[3]);
const ms = (seconds: number) => seconds * 1000;
const CONTROL_TRANSITION_MS = 200;

/** 每项错峰延迟（毫秒），与 Web 的 delay: index * step 对齐 */
export function stagger(index: number, step: number) {
  return ms(index * step);
}

/** 布局过渡：组件级位移，替代 Framer Motion 的 layout 动画 */
export const layoutTransition = LinearTransition.springify()
  .damping(mt.spring.sheet.damping)
  .stiffness(mt.spring.sheet.stiffness);

/* ------------------------------------------------------------------ */
/* Presence — 出现 / 消失，替代 AnimatePresence                          */
/* ------------------------------------------------------------------ */
/**
 * 直接复用 Reanimated 的 entering / exiting：
 * 卸载时 Reanimated 会保留视图直到退出动画播完，语义与 AnimatePresence 一致。
 */
export function Presence({
  visible,
  children,
  style,
  exit = 'fade',
}: {
  visible: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  exit?: 'fade' | 'none';
}) {
  if (!visible) return null;
  return (
    <Animated.View
      style={style}
      entering={ReanimatedFadeIn.duration(ms(mt.duration.base)).easing(easeIos)}
      exiting={
        exit === 'none'
          ? undefined
          : ReanimatedFadeOut.duration(ms(mt.duration.fast)).easing(easeIos)
      }>
      {children}
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* 落位 · FadeIn / SlideIn / ScaleIn                                    */
/* ------------------------------------------------------------------ */
type EnterProps = {
  children: ReactNode;
  /** 延迟秒数，用于列表错峰 */
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

/** 淡入落位 */
export function FadeIn({ children, delay = 0, duration = mt.duration.base, style }: EnterProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withDelay(ms(delay), withTiming(1, { duration: ms(duration), easing: easeIos })));
  }, [progress, delay, duration]);

  const animated = useAnimatedStyle(() => ({ opacity: progress.get() }));

  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
}

/** 滑入落位：push 从右侧 26，上浮从下方 16 */
export function SlideIn({
  children,
  from = 'right',
  delay = 0,
  duration = mt.duration.base,
  style,
}: EnterProps & { from?: 'right' | 'up' }) {
  const progress = useSharedValue(0);
  const offset = from === 'right' ? 26 : 16;

  useEffect(() => {
    progress.set(withDelay(ms(delay), withTiming(1, { duration: ms(duration), easing: easeIos })));
  }, [progress, delay, duration]);

  const animated = useAnimatedStyle(() => {
    const shift = interpolate(progress.get(), [0, 1], [offset, 0], Extrapolation.CLAMP);
    return {
      opacity: progress.get(),
      transform: from === 'right' ? [{ translateX: shift }] : [{ translateY: shift }],
    };
  });

  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
}

/** 弹簧落位：Alert 弹出用 0.86，成功对勾用 0.4 */
export function ScaleIn({
  children,
  from = 0.86,
  delay = 0,
  spring = mt.spring.pop,
  style,
}: EnterProps & { from?: number; spring?: { damping: number; stiffness: number; mass?: number } }) {
  const progress = useSharedValue(0);

  const damping = spring.damping;
  const stiffness = spring.stiffness;
  const mass = spring.mass ?? 1;

  useEffect(() => {
    progress.set(withDelay(ms(delay), withSpring(1, { damping, stiffness, mass })));
  }, [progress, delay, damping, stiffness, mass]);

  const animated = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.get(), [0, 1], [from, 1], Extrapolation.CLAMP) }],
  }));

  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
}

/* ------------------------------------------------------------------ */
/* 弹簧 · 按压反馈                                                      */
/* ------------------------------------------------------------------ */
/**
 * 触摸反馈替代 Web 的 hover / active：
 * 按下去缩到 scale，抬手用 press 弹簧回弹。
 * 用法：把 animatedStyle 给 Animated.View，把两个 handler 给里面的 Pressable。
 */
export function usePressFeedback(scale = 0.98) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.get(), [0, 1], [1, scale], Extrapolation.CLAMP) }],
  }));

  return {
    animatedStyle,
    onPressIn: () => {
      pressed.set(withTiming(1, { duration: CONTROL_TRANSITION_MS, easing: easeIos }));
    },
    onPressOut: () => {
      pressed.set(withSpring(0, { ...mt.spring.press, mass: mt.spring.press.mass ?? 1 }));
    },
  };
}

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  /** 按下时的缩放比例 */
  scale?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/** 带统一按压反馈的可点容器 */
export function PressableScale({
  children,
  scale = 0.98,
  className,
  style,
  disabled,
  ...rest
}: PressableScaleProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback(scale);

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        className={className}
        disabled={disabled}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        {...rest}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* 进度绘制 · 完成环 / 计量条                                            */
/* ------------------------------------------------------------------ */
/** 0 → 1 的绘制进度，1100ms ease-ios，与 Web 的 strokeDashoffset 一致 */
export function useDrawProgress(target: number, duration = mt.draw): SharedValue<number> {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(target, { duration: ms(duration), easing: easeIos }));
  }, [progress, target, duration]);

  return progress;
}

/** 分段指示器位移：共享元素弹簧（480 / 38） */
export function useSegmentIndicator(value: number, count: number, trackWidth: number) {
  const progress = useSharedValue(value);

  useEffect(() => {
    progress.set(withSpring(value, { ...mt.spring.segment, mass: mt.spring.segment.mass ?? 1 }));
  }, [progress, value, count, trackWidth]);

  return useAnimatedStyle(() => {
    const item = trackWidth / Math.max(count, 1);
    return { transform: [{ translateX: progress.get() * item }] };
  });
}

/** 开关滑块位移：toggle 弹簧（560 / 36） */
export function useToggleKnob(checked: boolean, travel: number) {
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    progress.set(
      withSpring(checked ? 1 : 0, { ...mt.spring.toggle, mass: mt.spring.toggle.mass ?? 1 })
    );
  }, [progress, checked, travel]);

  return useAnimatedStyle(() => ({ transform: [{ translateX: progress.get() * travel }] }));
}

/**
 * 开关轨道：颜色随状态过渡（Web 是 transition-colors duration-300）。
 * 同时返回滑块与轨道的动画样式，避免组件内再建一份共享值。
 */
export function useToggle(checked: boolean, travel: number, colors: { off: string; on: string }) {
  const knobProgress = useSharedValue(checked ? 1 : 0);
  const colorProgress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    knobProgress.set(
      withSpring(checked ? 1 : 0, { ...mt.spring.toggle, mass: mt.spring.toggle.mass ?? 1 })
    );
    colorProgress.set(withTiming(checked ? 1 : 0, { duration: 300, easing: easeIos }));
  }, [knobProgress, colorProgress, checked, travel]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knobProgress.get() * travel }],
  }));
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(colorProgress.get(), [0, 1], [colors.off, colors.on]),
  }));

  return { knobStyle, trackStyle };
}

/** 状态切换的淡入（Tab 切换：opacity 0 → 1 · 240ms） */
export function useFadeSwap(key: string | number, duration = mt.duration.base) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(0);
    progress.set(withTiming(1, { duration: ms(duration), easing: easeIos }));
  }, [progress, key, duration]);

  return useAnimatedStyle(() => ({ opacity: progress.get() }));
}

/* ------------------------------------------------------------------ */
/* 挂载/卸载与动画进度解耦（overlay 场景需要显式控制）                     */
/* ------------------------------------------------------------------ */
/**
 * visible 变 false 时先播完退出动画再卸载。
 * 返回的 progress 是 0 → 1 的共享值，由调用方插值成 opacity / translateY / scale。
 */
/** Sheet / FullScreenModal：使用与 Web 相同的弹簧完成进出场后再卸载。 */
export function useSpringPresence(
  visible: boolean,
  spring = mt.spring.sheet
): { mounted: boolean; progress: SharedValue<number> } {
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);
  const damping = spring.damping;
  const stiffness = spring.stiffness;
  const mass = spring.mass ?? 1;

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      progress.set(withSpring(1, { damping, stiffness, mass }));
      return;
    }
    if (!mounted) return;
    progress.set(
      withSpring(0, { damping, stiffness, mass }, (finished) => {
        if (finished) scheduleOnRN(setMounted, false);
      })
    );
  }, [visible, mounted, progress, damping, stiffness, mass]);

  return { mounted, progress };
}

export function usePresence(
  visible: boolean,
  options?: { enterMs?: number; exitMs?: number }
): { mounted: boolean; progress: SharedValue<number> } {
  const enterMs = options?.enterMs ?? ms(mt.duration.base);
  const exitMs = options?.exitMs ?? ms(mt.duration.fast);
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);

  // 渲染期同步：React 官方的「props 变化时调整 state」模式
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      progress.set(withTiming(1, { duration: enterMs, easing: easeIos }));
      return;
    }
    if (!mounted) return;
    progress.set(
      withTiming(0, { duration: exitMs, easing: easeIos }, (finished) => {
        if (finished) scheduleOnRN(setMounted, false);
      })
    );
  }, [visible, mounted, enterMs, exitMs, progress]);

  return { mounted, progress };
}

export { Animated };
export { scheduleOnRN };
