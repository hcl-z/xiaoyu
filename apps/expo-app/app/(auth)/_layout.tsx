import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/session';

/**
 * 欢迎 / 登录 / 注册：同一套排版，但没有标签栏与打卡入口。
 *
 * 登录 / 注册成功由这里统一把用户送进产品，各表单只管提交。
 */
export default function AuthLayout() {
  const { status } = useSession();

  if (status === 'signedIn') return <Redirect href="/today" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
