import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * /checkin 保留为深链入口：重定向到今日页并自动展开打卡弹层。
 * 弹层本身由 CheckinProvider 在当前页面就地呈现，不再是独立页面。
 */
export default function CheckinDeepLink() {
  const params = useLocalSearchParams<{ meal?: string; recipe?: string }>();

  return (
    <Redirect
      href={{
        pathname: '/today',
        params: {
          checkin: '1',
          ...(typeof params.meal === 'string' ? { meal: params.meal } : {}),
          ...(typeof params.recipe === 'string' ? { recipe: params.recipe } : {}),
        },
      }}
    />
  );
}
