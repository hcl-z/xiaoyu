import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CheckinProvider } from '@/chrome/checkin';
import { SessionProvider } from '@/session';
import { color } from '@/theme';

/** 全屏任务页：交给 ModalRoute 呈现，路由本身保持透明、不播系统动画 */
const MODAL_ROUTE_OPTIONS = {
  presentation: 'transparentModal',
  animation: 'none',
  gestureEnabled: false,
  contentStyle: { backgroundColor: 'transparent' },
} as const;

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* 底部弹层的 portal：Modal 会渲染在这里，盖住栈内的所有页面 */}
        <BottomSheetModalProvider>
          <SessionProvider>
            {/* 打卡弹层挂在根部：标签页与推入页都能唤起同一个弹层 */}
            <CheckinProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: color.paper },
                }}>
                <Stack.Screen name="index" options={{ animation: 'fade' }} />
                <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                <Stack.Screen
                  name="recipes/[slug]/index"
                  options={{ animation: 'slide_from_right' }}
                />
                {/* 全屏任务层：透明呈现，背板与圆角面板由 ModalRoute 自己画 */}
                <Stack.Screen name="recipes/new" options={MODAL_ROUTE_OPTIONS} />
                <Stack.Screen name="recipes/[slug]/edit" options={MODAL_ROUTE_OPTIONS} />
                <Stack.Screen name="profile/categories" options={MODAL_ROUTE_OPTIONS} />
                <Stack.Screen name="profile/tags" options={MODAL_ROUTE_OPTIONS} />
              </Stack>
              <StatusBar style="dark" />
            </CheckinProvider>
          </SessionProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
