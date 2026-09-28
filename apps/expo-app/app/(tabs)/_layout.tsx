import { View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTabBar, CheckinLayer, type BottomTabsRenderProps } from '@/chrome';
import { useSession } from '@/session';
import { layout } from '@/theme';

/**
 * 产品标签页：今日 / 菜谱 / 我的。
 * 标签栏与打卡键只在这三个根页面出现，推入页与弹窗页自然没有。
 */
export default function TabsLayout() {
  const { status } = useSession();
  const insets = useSafeAreaInsets();

  if (status === 'loading') return <View className="bg-paper flex-1" />;
  if (status === 'signedOut') return <Redirect href="/welcome" />;

  const tabBarHeight = layout.tabH + Math.max(insets.bottom, 8);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <AppTabBar {...(props as unknown as BottomTabsRenderProps)} />}>
        <Tabs.Screen name="today" options={{ title: '今日' }} />
        <Tabs.Screen name="recipes" options={{ title: '菜谱' }} />
        <Tabs.Screen name="profile" options={{ title: '我的' }} />
      </Tabs>
      <CheckinLayer bottomOffset={tabBarHeight + 16} />
    </View>
  );
}
