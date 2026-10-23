/**
 * ActionSheet — iOS 动作单
 * ------------------------------------------------------------------
 * 「拍照 / 从相册选 / 取消」这类「问一句再动手」的场景用它。
 *
 * 为什么不用 Alert：Alert 是居中卡片，语气是「确认一件危险的事」；
 * 动作单贴底、按钮大、取消独立成块，才是 iOS 里表达「选一个来源」的形状。
 *
 * 为什么不用 RN 的 ActionSheetIOS：它只在 iOS 存在，Android 要另写一套，
 * 两端样式会分叉。这里用 Modal + 自己画，两端完全一致。
 */
import type { ReactNode } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSpringPresence } from '@/motion';
import { alpha, color, elevationStyle, hairline, radius } from '@/theme';

import { Body, Caption } from '@/components/text';

export type ActionSheetAction = {
  label: string;
  /** 说明这一项会做什么；省略则只显示标题 */
  detail?: string;
  icon?: ReactNode;
  onPress: () => void;
  destructive?: boolean;
};

export function ActionSheet({
  open,
  title,
  message,
  actions,
  onCancel,
  cancelLabel = '取消',
}: {
  open: boolean;
  title?: string;
  message?: string;
  actions: ActionSheetAction[];
  onCancel: () => void;
  cancelLabel?: string;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { mounted, progress } = useSpringPresence(open);
  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * height }],
  }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      <View className="flex-1 justify-end">
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: alpha.glassDark,
            },
            backdropStyle,
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          onPress={onCancel}
          className="absolute inset-0"
        />

        <Animated.View
          style={[panelStyle, { paddingBottom: Math.max(insets.bottom, 12) }]}
          className="px-3">
          {/* 动作分组：标题 + 若干项 */}
          <View
            className="rounded-card overflow-hidden"
            style={{ backgroundColor: color.card, ...elevationStyle.float }}>
            {title || message ? (
              <View className="items-center px-5 pt-4 pb-3.5">
                {title ? (
                  <Caption size="text-[13px]" weight="font-semibold" tone="soft">
                    {title}
                  </Caption>
                ) : null}
                {message ? (
                  <Caption size="text-[12px]" className="mt-1 text-center">
                    {message}
                  </Caption>
                ) : null}
              </View>
            ) : null}

            {actions.map((action, i) => (
              <View key={action.label}>
                {(title || message || i > 0) && (
                  <View className="bg-hair/70 ml-4" style={{ height: hairline }} />
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  onPress={action.onPress}
                  className="active:bg-fill min-h-[52px] flex-row items-center gap-3 px-4 py-3">
                  {action.icon}
                  <View className="min-w-0 flex-1">
                    <Body
                      size="text-[17px]"
                      weight="font-medium"
                      tone={action.destructive ? 'danger' : 'accent'}
                      numberOfLines={1}>
                      {action.label}
                    </Body>
                    {action.detail ? (
                      <Caption size="text-[12px]" className="mt-0.5" numberOfLines={1}>
                        {action.detail}
                      </Caption>
                    ) : null}
                  </View>
                </Pressable>
              </View>
            ))}
          </View>

          {/* 取消独立成块：iOS 的动作单里它不跟选项挤在一起 */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
            onPress={onCancel}
            className="rounded-card active:bg-fill mt-2 min-h-[52px] items-center justify-center"
            style={{ backgroundColor: color.card, ...elevationStyle.float }}>
            <Body size="text-[17px]" weight="font-semibold" tone="accent">
              {cancelLabel}
            </Body>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** 动作单里用的圆底图标（与列表行的 leading 同一形状） */
export function ActionSheetIcon({ children }: { children: ReactNode }) {
  return (
    <View
      className="bg-fill h-9 w-9 shrink-0 items-center justify-center"
      style={{ borderRadius: radius.control }}>
      {children}
    </View>
  );
}
