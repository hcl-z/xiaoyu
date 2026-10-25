/**
 * 标签页屏幕的通用边距：顶部避开状态栏，底部避开标签栏与悬浮按钮。
 * 数值全部来自 @/theme 的 layout 令牌，屏幕代码不自己写数字。
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '@/theme';

/**
 * 悬浮按钮真正侵入滚动区的深度：滚动区本身止于标签栏上缘，
 * FAB 底缘悬在标签栏上缘之上 20px，再加 56px 键体——底部让位就这么多，
 * 不再叠加标签栏高度，也不再额外加呼吸（那会在页面底部顶出一大块空白）。
 */
const FAB_BOTTOM_GAP = 20;
const FAB_SIZE = 56;
const FAB_CLEARANCE = FAB_SIZE + FAB_BOTTOM_GAP;

export function useTabScreenPadding() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = layout.tabH + Math.max(insets.bottom, 8);
  return {
    insets,
    tabBarHeight,
    paddingTop: insets.top + 8,
    paddingBottom: FAB_CLEARANCE,
    scrollBottom: tabBarHeight + 32,
  };
}
