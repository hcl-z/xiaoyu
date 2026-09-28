/**
 * daily + · NATIVE TOKEN DERIVATIONS
 * ------------------------------------------------------------------
 * 第二层令牌：NativeWind 表达不干净、必须交给 React Native 的部分——
 * 阴影、表格数字、发丝线宽。全部由 tokens.ts 派生，这里不出现新的数值。
 *
 * 阴影为什么走 TS 而不是 className：Animated.View 不受 NativeWind 接管，
 * 而分段指示器、开关滑块、底部弹层都需要把阴影交给原生视图/动画样式。
 * global.css 的 @theme 里也定义了同名的 --shadow-*，两条路径取值一致，
 * 与 Web 仓库「tokens.ts 镜像 globals.css @theme」的做法保持一致。
 */
import type { BoxShadowValue, TextStyle } from 'react-native';

import type { ElevationName } from './tokens';

/* ------------------------------------------------------------------ */
/* Elevation — RN boxShadow（多层写法与 Web 的 box-shadow 一致）         */
/* ------------------------------------------------------------------ */
const shadows: Record<ElevationName, readonly BoxShadowValue[]> = {
  card: [
    { offsetX: 0, offsetY: 1, blurRadius: 2, color: 'rgba(28,28,30,0.04)' },
    { offsetX: 0, offsetY: 18, blurRadius: 36, spreadDistance: -26, color: 'rgba(28,28,30,0.4)' },
  ],
  float: [
    { offsetX: 0, offsetY: 2, blurRadius: 6, color: 'rgba(28,28,30,0.06)' },
    { offsetX: 0, offsetY: 34, blurRadius: 60, spreadDistance: -34, color: 'rgba(28,28,30,0.55)' },
  ],
  lift: [
    { offsetX: 0, offsetY: 16, blurRadius: 30, spreadDistance: -16, color: 'rgba(0,122,255,0.95)' },
  ],
  fab: [
    { offsetX: 0, offsetY: 14, blurRadius: 26, spreadDistance: -12, color: 'rgba(0,122,255,1)' },
  ],
  sheet: [
    { offsetX: 0, offsetY: -18, blurRadius: 44, spreadDistance: -30, color: 'rgba(28,28,30,0.5)' },
  ],
};

const webElevationStyle = {
  card: { boxShadow: shadows.card },
  float: { boxShadow: shadows.float },
  lift: { boxShadow: shadows.lift },
  fab: { boxShadow: shadows.fab },
  sheet: { boxShadow: shadows.sheet },
};

const nativeElevationStyle = {
  card: {
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 4,
        blurRadius: 14,
        spreadDistance: 0,
        color: 'rgba(21, 24, 29, 0.12)',
      },
    ],
  },
  float: {
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 11,
        blurRadius: 28,
        spreadDistance: 0,
        color: 'rgba(21, 24, 29, 0.18)',
      },
    ],
  },
  lift: {
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 6,
        blurRadius: 18,
        spreadDistance: 0,
        color: 'rgba(0, 99, 247, 0.28)',
      },
    ],
  },
  fab: {
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 6,
        blurRadius: 18,
        spreadDistance: 0,
        color: 'rgba(0, 99, 247, 0.28)',
      },
    ],
  },
  sheet: {
    boxShadow: [
      {
        offsetX: 0,
        offsetY: -6,
        blurRadius: 20,
        spreadDistance: 0,
        color: 'rgba(21, 24, 29, 0.16)',
      },
    ],
  },
};

export const elevationStyle =
  process.env.EXPO_OS === 'web' ? webElevationStyle : nativeElevationStyle;

/* ------------------------------------------------------------------ */
/* Numerals — Web 的 u-num 在原生走 fontVariant                          */
/* ------------------------------------------------------------------ */
export const numeric: TextStyle = { fontVariant: ['tabular-nums'] };

/* ------------------------------------------------------------------ */
/* Hairline                                                             */
/* ------------------------------------------------------------------ */
/** 发丝线宽：Web 用 1px，原生同样取 1，保证描边可见且与 Web 观感一致 */
export const hairline = 1;
