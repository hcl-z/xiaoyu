import { useState } from 'react';
import { View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTabBar, CheckinLayer, type BottomTabsRenderProps } from '@/chrome';
import { Alert } from '@/chrome/overlays';
import { installUpdate, useDailyUpdateCheck, type AppRelease } from '@/data/updates';
import { useSession } from '@/session';
import { layout } from '@/theme';

/**
 * 产品标签页：今日 / 菜谱 / 我的。
 * 标签栏与打卡键只在这三个根页面出现，推入页与弹窗页自然没有。
 * 每日一次的更新检查也挂在这里：应用在前台时它才有可能触发提醒。
 */
export default function TabsLayout() {
  const { status } = useSession();
  const insets = useSafeAreaInsets();
  const [updateOffer, setUpdateOffer] = useState<AppRelease | null>(null);

  useDailyUpdateCheck((release) => setUpdateOffer(release));

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
      <Alert
        open={updateOffer !== null}
        title="发现新版本"
        message={
          updateOffer
            ? `新版本 ${updateOffer.version} 已发布，更新包约 ${(updateOffer.size / 1024 / 1024).toFixed(1)} MB。`
            : ''
        }
        cancelLabel="稍后提醒"
        confirmLabel="立即更新"
        destructive={false}
        onCancel={() => setUpdateOffer(null)}
        onConfirm={() => {
          const release = updateOffer;
          setUpdateOffer(null);
          if (release) void installUpdate(release);
        }}
      />
    </View>
  );
}
