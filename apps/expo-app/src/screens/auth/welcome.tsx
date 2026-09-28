/**
 * 欢迎页：首次启动的一句话主张 + 矢量碗插画。
 * 「先逛逛」直接进入公共演示空间，不要求任何账号信息。
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BowlMark } from '@/brand/bowl-mark';
import { Button } from '@/components/button';
import { Section } from '@/components/surfaces';
import { Icon, type IconName } from '@/components/icon';
import { Body, Caption, Display, Subhead, Wordmark } from '@/components/text';
import { useSession } from '@/session';

const FEATURES: { icon: IconName; title: string; note: string }[] = [
  { icon: 'book-open', title: '菜谱库', note: '分类、用时、可勾选食材' },
  { icon: 'calendar-check', title: '每日打卡', note: '自由记录与连续天数' },
  { icon: 'chart-column', title: '习惯回顾', note: '28 天热力图' },
];

export function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signInDemo, busy } = useSession();
  const [error, setError] = useState('');

  /** 免验证入口：直接进入公共演示空间 */
  const browse = async () => {
    setError('');
    const res = await signInDemo();
    // 失败时把服务端 / 网络的原话显示出来，避免按钮看起来毫无反应
    if (!res.ok) setError(res.error);
  };

  return (
    <View className="bg-paper flex-1" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-6 pt-1">
        <Wordmark className="text-[17px]" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="先逛逛"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={() => void browse()}
          hitSlop={8}
          className="px-2 py-1">
          <Body tone="accent" size="text-[15px]">
            {busy ? '进入中…' : '先逛逛'}
          </Body>
        </Pressable>
      </View>

      <View className="flex-1 justify-center px-6 py-6">
        <BowlMark size={104} />

        <View className="mt-7">
          <Display className="max-w-[300px] leading-tight">
            把每一天，{'\n'}煮成值得记录的样子
          </Display>
        </View>

        <Body tone="muted" className="mt-3.5 max-w-[272px] leading-relaxed">
          daily + 收好你的菜谱，也收好每一餐认真吃过的证据。
        </Body>

        <View className="mt-7">
          <Section>
            {FEATURES.map((f) => (
              <View key={f.title} className="flex-row items-center gap-3 px-4 py-3">
                <View className="bg-tint rounded-control h-8 w-8 items-center justify-center">
                  <Icon name={f.icon} size="md" tone="accent" />
                </View>
                <View className="min-w-0 flex-1">
                  <Subhead size="text-body" weight="font-medium">
                    {f.title}
                  </Subhead>
                  <Caption className="mt-0.5">{f.note}</Caption>
                </View>
              </View>
            ))}
          </Section>
        </View>
      </View>

      <View className="px-6" style={{ paddingBottom: Math.max(insets.bottom, 24) + 16 }}>
        {error ? (
          <View className="mb-3 flex-row items-start gap-2 px-1">
            <View className="mt-[3px] shrink-0">
              <Icon name="circle-alert" size="sm" tone="danger" />
            </View>
            <Caption tone="danger" className="flex-1 leading-relaxed">
              {error}
            </Caption>
          </View>
        ) : null}
        <Button size="lg" block onPress={() => router.push('/register')}>
          开始使用
        </Button>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="我已有账号，登录"
          onPress={() => router.push('/login')}
          className="mt-3.5 items-center py-1">
          <Body tone="accent" size="text-[15px]">
            我已有账号，登录
          </Body>
        </Pressable>
      </View>
    </View>
  );
}
