/**
 * 标签页屏幕的通用边距：顶部避开状态栏，底部避开标签栏与悬浮按钮。
 * 数值全部来自 @/theme 的 layout 令牌，屏幕代码不自己写数字。
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '@/theme';

/**
 * 悬浮按钮真正侵入滚动区的深度：标签栏上缘之下还有 16px 间距 + 56px 键体，
 * 滚动区本身止于标签栏上缘，所以底部让位只算这一段（再加 12px 呼吸），
 * 不再叠加标签栏高度——那会把页面底部顶出一大块空白。
 */
const FAB_CLEARANCE = 56 + 16 + 12;

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
