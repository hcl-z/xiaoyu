/**
 * 品牌插画：一只碗与三缕热气。纯矢量，欢迎 / 登录 / 注册共用，
 * 保证启动流程视觉一致。Web 版用 framer-motion，这里换成 Reanimated。
 */
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { color, motion as mt } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const BOWL_ARC = 'M22 62 H118 A48 48 0 0 1 22 62 Z';
/**
 * 这条路径 = 96 的直线碗沿 + 半径 48 的半圆（πr ≈ 151），合计约 247。
 * 取略大于实际值，画满后停住。
 */
const PATH_LENGTH = 250;
const easeIos = Easing.bezier(mt.ease[0], mt.ease[1], mt.ease[2], mt.ease[3]);

export function BowlMark({ size = 104 }: { size?: number }) {
  const draw = useSharedValue(0);
  const pop = useSharedValue(0);
  const steam = useSharedValue(0);

  useEffect(() => {
    draw.set(withTiming(1, { duration: 1000, easing: easeIos }));
    pop.set(withDelay(700, withSpring(1, { ...mt.spring.pop, mass: 1 })));
    steam.set(withRepeat(withTiming(1, { duration: 3000, easing: Easing.linear }), -1, false));
  }, [draw, pop, steam]);

  const arcProps = useAnimatedProps(() => ({
    strokeDasharray: [PATH_LENGTH, PATH_LENGTH],
    strokeDashoffset: PATH_LENGTH * (1 - draw.get()),
  }));

  const circleProps = useAnimatedProps(() => ({ opacity: pop.get() }));

  return (
    <Svg width={size} height={(size * 118) / 140} viewBox="0 0 140 118">
      <AnimatedPath
        d={BOWL_ARC}
        fill="none"
        stroke={color.ink}
        strokeWidth={2.4}
        strokeLinecap="round"
        animatedProps={arcProps}
      />
      <Path d="M14 62 H126" stroke={color.ink} strokeWidth={2.4} strokeLinecap="round" />
      <Path
        d="M40 74 H100"
        stroke={color.accent}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeDasharray="3 7"
      />
      {[46, 70, 94].map((x, i) => (
        <SteamPath key={x} x={x} index={i} progress={steam} />
      ))}
      <AnimatedCircle cx={112} cy={26} r={7} fill={color.accent} animatedProps={circleProps} />
    </Svg>
  );
}

function SteamPath({
  x,
  index,
  progress,
}: {
  x: number;
  index: number;
  progress: { get: () => number };
}) {
  const props = useAnimatedProps(() => {
    // 每缕热气错峰 0.45s，形成「此起彼伏」的呼吸
    const shifted = (progress.get() + index * 0.15) % 1;
    const fade = shifted < 0.5 ? shifted * 2 : (1 - shifted) * 2;
    return { opacity: 0.15 + fade * 0.7 };
  });

  return (
    <AnimatedPath
      d={`M${x} 50 C ${x - 7} 40, ${x + 7} 34, ${x} 24`}
      fill="none"
      stroke={color.lake}
      strokeWidth={2.2}
      strokeLinecap="round"
      animatedProps={props}
    />
  );
}
