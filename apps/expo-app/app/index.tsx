import { View } from 'react-native';
import { Redirect } from 'expo-router';

import { useSession } from '@/session';

/**
 * 启动路由：等会话恢复出结果，再决定去产品还是去欢迎页。
 * 恢复期间留白，避免先闪一下欢迎页再跳走。
 */
export default function Index() {
  const { status } = useSession();

  if (status === 'loading') return <View className="bg-paper flex-1" />;

  return <Redirect href={status === 'signedIn' ? '/today' : '/welcome'} />;
}
