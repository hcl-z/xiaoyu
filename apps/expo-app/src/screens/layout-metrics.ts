/**
 * 标签页屏幕的通用边距：顶部避开状态栏，底部避开标签栏与悬浮按钮。
 * 数值全部来自 @/theme 的 layout 令牌，屏幕代码不自己写数字。
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '@/theme';

/** 悬浮按钮直径 + 与标签栏的间距 */
const FAB_CLEARANCE = 56 + 24;

export function useTabScreenPadding() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = layout.tabH + Math.max(insets.bottom, 8);
  return {
    insets,
    tabBarHeight,
    paddingTop: insets.top + 8,
    paddingBottom: tabBarHeight + FAB_CLEARANCE,
    scrollBottom: tabBarHeight + 32,
  };
}
