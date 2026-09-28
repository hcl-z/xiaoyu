/**
 * 登录 / 注册共用骨架：导航条 → 品牌区 → 表单 → 错误 → 底部操作。
 * 三个入口共享同一套间距与层级，避免各写一套导致风格漂移。
 */
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { BowlMark } from '@/brand/bowl-mark';
import { NavBar } from '@/chrome';
import { Icon } from '@/components/icon';
import { Body, Caption, Display } from '@/components/text';

export function AuthScaffold({
  title,
  description,
  backTo = '/welcome',
  actionLabel,
  onAction,
  error,
  children,
  footer,
}: {
  title: string;
  description: string;
  backTo?: string;
  /** 导航条右侧的互换入口（登录 ↔ 注册） */
  actionLabel: string;
  onAction: () => void;
  error?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="bg-paper flex-1">
      <View style={{ paddingTop: insets.top }}>
        <NavBar
          variant="compact"
          transparent
          onBack={() => router.replace(backTo)}
          backLabel="返回"
          trailing={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              onPress={onAction}
              hitSlop={8}
              className="px-2 py-1">
              <Body tone="accent" size="text-[15px]" weight="font-medium">
                {actionLabel}
              </Body>
            </Pressable>
          }
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BowlMark size={56} />

          <View className="mt-4">
            <Display>{title}</Display>
          </View>
          <Body tone="muted" className="mt-2 max-w-[264px] leading-relaxed">
            {description}
          </Body>

          <View className="mt-6">{children}</View>

          {error ? (
            <View className="mt-3 flex-row items-start gap-2 px-1">
              <View className="mt-[3px] shrink-0">
                <Icon name="circle-alert" size="sm" tone="danger" />
              </View>
              <Caption tone="danger" className="flex-1 leading-relaxed">
                {error}
              </Caption>
            </View>
          ) : null}

          <View className="mt-8">{footer}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
