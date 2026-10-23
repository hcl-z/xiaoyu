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
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn as ReanimatedFadeIn,
  FadeOut as ReanimatedFadeOut,
  interpolate,
  interpolateColor,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
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

/* ------------------------------------------------------------------ */
/* 减弱动效 · Reduce Motion                                             */
/* ------------------------------------------------------------------ */
/**
 * 系统「减弱动态效果」开关。开启后所有位移 / 缩放 / 弹簧都塌缩成极短的淡入，
 * 既不消失也不让人难受——这是可访问性要求，不是可选项。
 *
 * 用法：需要做「位移或缩放」的组件先读这个值，再决定用哪套参数；
 * 纯透明度过渡不受影响，可以照常播放。
 */
export function useMotionPreference(): {
  /** 系统是否要求减弱动效 */
  reduceMotion: boolean;
  /** 位移 / 缩放类过渡的时长（秒）；减弱时塌缩为 0 */
  spatialDuration: (seconds: number) => number;
  /** 逐项错峰延迟（秒）；减弱时一律为 0 */
  spatialStagger: (index: number, step: number) => number;
} {
  const reduceMotion = useReducedMotion();

  return {
    reduceMotion,
    spatialDuration: (seconds) => (reduceMotion ? 0 : seconds),
    spatialStagger: (index, step) => (reduceMotion ? 0 : index * step),
  };
}

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

/** 滑入落位：push 从右侧 26，上浮从下方 16（减弱动效时只保留淡入） */
export function SlideIn({
  children,
  from = 'right',
  delay = 0,
  duration = mt.duration.base,
  style,
}: EnterProps & { from?: 'right' | 'up' }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  // 减弱动效：位移归零，只留一次淡入
  const offset = reduceMotion ? 0 : from === 'right' ? 26 : 16;

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

/** 弹簧落位：Alert 弹出用 0.86，成功对勾用 0.4（减弱动效时只保留淡入） */
export function ScaleIn({
  children,
  from = 0.86,
  delay = 0,
  spring = mt.spring.pop,
  style,
}: EnterProps & { from?: number; spring?: { damping: number; stiffness: number; mass?: number } }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  // 减弱动效：缩放归零，只留一次淡入
  const start = reduceMotion ? 1 : from;

  const damping = spring.damping;
  const stiffness = spring.stiffness;
  const mass = spring.mass ?? 1;

  useEffect(() => {
    progress.set(withDelay(ms(delay), withSpring(1, { damping, stiffness, mass })));
  }, [progress, delay, damping, stiffness, mass]);

  const animated = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.get(), [0, 1], [start, 1], Extrapolation.CLAMP) }],
  }));

  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
}

/* ------------------------------------------------------------------ */
/* 内容换批 · SwapIn / useSwapKey                                       */
/* ------------------------------------------------------------------ */
/**
 * 内容换批（列表筛选、Tab 面板、日期切换）时新内容如何落位。
 *
 * 与 FadeIn 的区别：FadeIn 只在挂载时播一次；SwapIn 由 key 驱动，
 * key 一变就重播，所以同一块容器换内容时也有落位动效。
 * 方向 +1 表示内容向「前」走（右侧滑入），-1 表示向后（左侧滑入）。
 */
export function SwapIn({
  swapKey,
  children,
  direction = 1,
  distance = 10,
  duration = mt.duration.base,
  style,
}: {
  /** 内容身份。变化即重播入场动效 */
  swapKey: string | number;
  children: ReactNode;
  /** +1 向右滑入，-1 向左滑入 */
  direction?: 1 | -1;
  /** 滑入位移（点） */
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const travel = reduceMotion ? 0 : direction * distance;

  useEffect(() => {
    progress.set(0);
    progress.set(withTiming(1, { duration: ms(duration), easing: easeIos }));
  }, [progress, duration, swapKey]);

  const animated = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: interpolate(p, [0, 1], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateX: interpolate(p, [0, 1], [travel, 0], Extrapolation.CLAMP) }],
    };
  });

  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
}

/**
 * 内容切换方向的公共骨架："props 变化时调整 state"（React 官方模式，
 * 不在 render 期写 ref），把「上一个值」与「新值」交给 compare 决定方向。
 * compare 返回 1 / -1 表示新旧次序；返回 0 或 undefined 表示无序，保持原方向。
 */
function useDirection(
  current: string | number,
  compare: (prev: string | number, next: string | number) => 1 | -1 | 0
) {
  const [prev, setPrev] = useState(current);
  const [direction, setDirection] = useState<1 | -1>(1);

  if (prev !== current) {
    const next = compare(prev, current);
    setPrev(current);
    if (next !== 0) setDirection(next);
  }

  return direction;
}

/**
 * 从后往前/从前往后比较两个内容身份，得到切换方向。
 * 用于 Tab 这类**有限且已知顺序**的切换：order 是全部可选值，
 * 新内容在列表里靠后就向右滑入。调用方把返回值交给 SwapIn 的 direction。
 */
export function useSwapDirection(current: string | number, order: readonly (string | number)[]) {
  return useDirection(current, (prev, next) => {
    const a = order.indexOf(prev);
    const b = order.indexOf(next);
    if (a === -1 || b === -1 || a === b) return 0;
    return b > a ? 1 : -1;
  });
}

/**
 * 日期（或任何 ISO 字符串 / 单调递增 id）的切换方向。
 * 序列是无限的，无法列成 order 数组，所以直接比字典序——
 * ISO 日期（YYYY-MM-DD）的字典序就是时间序。
 * 往后一天从右侧进，往前一天从左侧进。
 */
export function useSequenceDirection(current: string | number) {
  return useDirection(current, (prev, next) => (prev === next ? 0 : next > prev ? 1 : -1));
}

/* ------------------------------------------------------------------ */
/* 屏幕落位 · ScreenEnter                                                */
/* ------------------------------------------------------------------ */
/**
 * 标签页根容器的入场：整页淡入 + 一点点上浮。
 *
 * Expo Router 的 Tabs 换页是瞬时挂载，不包一下就会“硬闪”。
 * 幅度刻意做得很小（8pt / 0.24s）——换页是导航而不是内容揭示，
 * 多出来的位移会让人误以为页面在跳动。
 */
export function ScreenEnter({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(1, { duration: ms(mt.duration.base), easing: easeIos }));
  }, [progress]);

  const animated = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: interpolate(p, [0, 1], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(p, [0, 1], [reduceMotion ? 0 : 8, 0], Extrapolation.CLAMP) },
      ],
    };
  });

  return <Animated.View style={[animated, { flex: 1 }, style]}>{children}</Animated.View>;
}

/**
 * 给屏幕组件套上标签页根容器的入场。
 * 三个标签页的 route 文件各自写一遍同样的包法只会产生三处重复；
 * 用这个 HOC 把「换页也有交代」这件事收敛到一处。
 *
 *   export default withScreenEnter(ProfileScreen);
 */
export function withScreenEnter<P extends object>(Screen: ComponentType<P>) {
  function ScreenEnterRoute(props: P) {
    return (
      <ScreenEnter>
        <Screen {...props} />
      </ScreenEnter>
    );
  }
  ScreenEnterRoute.displayName = `withScreenEnter(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return ScreenEnterRoute;
}

/* ------------------------------------------------------------------ */
/* 逐项落位 · StaggerItem                                               */
/* ------------------------------------------------------------------ */
/**
 * 列表项的错峰入场。放在 map 里，index 决定延迟，封顶后不再累加延迟——
 * 否则长列表的最后一项要等很久。
 *
 * 用法：
 *   <StaggerItem index={i} count={list.length}>
 *     <ListRow ... />
 *   </StaggerItem>
 */
export function StaggerItem({
  index,
  step = mt.stagger.list,
  cap = mt.stagger.listCap,
  children,
  style,
}: {
  index: number;
  step?: number;
  /** 参与错峰的最大项数 */
  cap?: number;
  /** 每一项都挂载时播放；换批时需要调用方用 key 重挂载 */
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  const delay = Math.min(index, cap) * step;

  useEffect(() => {
    if (reduceMotion) {
      progress.set(1);
      return;
    }
    progress.set(0);
    progress.set(
      withDelay(ms(delay), withTiming(1, { duration: ms(mt.duration.base), easing: easeIos }))
    );
  }, [progress, delay, reduceMotion]);

  const animated = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: interpolate(p, [0, 1], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(p, [0, 1], [8, 0], Extrapolation.CLAMP) }],
    };
  });

  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
}

/* ------------------------------------------------------------------ */
/* 骨架 → 内容 · CrossFade                                              */
/* ------------------------------------------------------------------ */
/**
 * 骨架屏与真实内容之间的交底：骨架淡出、内容淡入，不让两者硬切。
 * 加载态本身由调用方决定（loading ? <Skeleton/> : <Content/>），
 * 这里只负责两层之间的过渡。
 *
 * 注意：骨架只给 exiting，不给 entering。
 * 骨架多半是首帧就要看到的（冷启动就停在 loading），给它 entering 会先白一下
 * 再淡入——那是多出来的一次「闪」，不是交底。真正需要过渡的只有两者之间那一次。
 */
export function CrossFade({
  /** 当前显示的是不是骨架态 */
  loading,
  skeleton,
  children,
  duration = mt.duration.base,
  style,
}: {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      {loading ? (
        <Animated.View exiting={ReanimatedFadeOut.duration(ms(duration)).easing(easeIos)}>
          {skeleton}
        </Animated.View>
      ) : (
        <Animated.View entering={ReanimatedFadeIn.duration(ms(duration)).easing(easeIos)}>
          {children}
        </Animated.View>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 弹簧 · 按压反馈                                                      */
/* ------------------------------------------------------------------ */
/**
 * 触摸反馈替代 Web 的 hover / active：
 * 按下去缩到 scale，抬手用 press 弹簧回弹。
 * 用法：把 animatedStyle 给 Animated.View，把两个 handler 给里面的 Pressable。
 */
export function usePressFeedback(scale: number = mt.pressScale.button) {
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

/**
 * 按压反馈的缩放幅度很小（0.92 ～ 0.99），即便开了减弱动效也不至于让人不适。
 * 这里不折叠它，否则整介面的可点感会消失。
 * 默认值走 mt.pressScale.button，与 Button 同一档——不在这里写裸数字。
 */

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  /** 按下时的缩放比例；默认按「常规按钮」档 */
  scale?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/** 带统一按压反馈的可点容器 */
export function PressableScale({
  children,
  scale = mt.pressScale.button,
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
/**
 * 0 → 1 的绘制进度，1100ms ease-ios，与 Web 的 strokeDashoffset 一致。
 * 减弱动效时直接落到终值，不做扫过的过程。
 */
export function useDrawProgress(target: number, duration = mt.draw): SharedValue<number> {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? target : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.set(target);
      return;
    }
    progress.set(withTiming(target, { duration: ms(duration), easing: easeIos }));
  }, [progress, target, duration, reduceMotion]);

  return progress;
}

/**
 * 分段指示器位移：共享元素弹簧（480 / 38）。
 *
 * 一个容易错的地方：位移步长必须和指示器实际宽度一致。
 * 指示器宽度是「轨道宽 - 两侧内边距」再平分，而轨道宽平分是另一回事；
 * 拿轨道宽去算步长，后面的分段就会从头偏出去（每段偏 2×padding/N）。
 * 所以这里直接吃已经算好的每段宽度，不再自己除一次。
 */
export function useSegmentIndicator(value: number, itemWidth: number) {
  const progress = useSharedValue(value);

  useEffect(() => {
    progress.set(withSpring(value, { ...mt.spring.segment, mass: mt.spring.segment.mass ?? 1 }));
  }, [progress, value]);

  return useAnimatedStyle(() => ({ transform: [{ translateX: progress.get() * itemWidth }] }));
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
