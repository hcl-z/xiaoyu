/**
 * 会话守卫：产品页在恢复会话期间先留白，未登录直接回入口。
 * 深链直接命中产品页时也不会看到半截界面。
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';

import { useSession } from './index';

export function RequireSession({ children }: { children: ReactNode }) {
  const { status } = useSession();

  if (status === 'loading') return <View className="bg-paper flex-1" />;
  if (status === 'signedOut') return <Redirect href="/welcome" />;

  return <>{children}</>;
}
