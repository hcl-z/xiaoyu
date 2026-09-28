/**
 * Expo Router 的标签栏桥接：把导航状态翻译成设计系统的 TabBar 契约。
 * 屏幕与标签栏之间只隔这一层，TabBar 本身不认识路由。
 */
import { TabBar, type TabItem } from './tabbar';

const TABS: { value: string; label: string; icon: TabItem['icon'] }[] = [
  { value: 'today', label: '今日', icon: 'calendar-check' },
  { value: 'recipes', label: '菜谱', icon: 'book-open' },
  { value: 'profile', label: '我的', icon: 'user-round' },
];

/** 只声明用得上的部分，避免把导航库的类型泄漏进设计系统 */
export type BottomTabsRenderProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

export function AppTabBar({ state, navigation }: BottomTabsRenderProps) {
  const active = state.routes[state.index]?.name ?? 'today';

  return <TabBar items={TABS} active={active} onSelect={(value) => navigation.navigate(value)} />;
}
