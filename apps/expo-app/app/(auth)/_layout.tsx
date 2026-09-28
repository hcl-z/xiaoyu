import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/session';

/**
 * 欢迎 / 登录 / 注册：同一套排版，但没有标签栏与打卡入口。
 *
 * 登录成功（含一键进入演示空间）由这里统一把用户送进产品：
 * 三个表单各写一次跳转容易漏，尤其是「先逛逛」这种只有一个动作的入口。
 */
export default function AuthLayout() {
  const { status } = useSession();

  if (status === 'signedIn') return <Redirect href="/today" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
