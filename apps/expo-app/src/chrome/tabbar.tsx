/**
 * TabBar · BottomActionBar
 * ------------------------------------------------------------------
 * Web 用 u-glass（backdrop-filter）做条状容器，原生换成半透明纸色；
 * Web 画一条假 Home 指示条，原生只在系统没有指示条的设备上补，
 * 并把真实安全区高度作为底部内边距。
 */
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elevationStyle } from '@/theme';

import { Icon, type IconName } from '@/components/icon';
import { Body, Micro } from '@/components/text';

import { HomeIndicator } from './navbar';

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

/** 系统是否已经画了 Home 指示条 */
const SYSTEM_INDICATOR_MIN_INSET = 20;

export type TabItem = { value: string; label: string; icon: IconName };

export function TabBar({
  items,
  active,
  onSelect,
  onAction,
  actionIcon = 'plus',
  actionLabel = '打卡',
  className,
}: {
  items: TabItem[];
  active: string;
  onSelect: (v: string) => void;
  onAction?: () => void;
  actionIcon?: IconName;
  actionLabel?: string;
  className?: string;
}) {
  const insets = useSafeAreaInsets();
  const showIndicator = insets.bottom < SYSTEM_INDICATOR_MIN_INSET;
  const half = Math.ceil(items.length / 2);

  const tab = (item: TabItem) => {
    const on = item.value === active;
    return (
      <Pressable
        key={item.value}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={item.label}
        onPress={() => onSelect(item.value)}
        className="w-16 flex-col items-center gap-1 py-1">
        <Icon name={item.icon} size="xl" tone={on ? 'accent' : 'muted'} />
        <Body
          tone={on ? 'accent' : 'muted'}
          size="text-[10.5px]"
          weight="font-semibold"
          numberOfLines={1}>
          {item.label}
        </Body>
      </Pressable>
    );
  };

  return (
    <View
      className={cx('border-hair/70 bg-paper/95 border-t', className)}
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
      <View className="flex-row items-end justify-around px-3 pt-2.5">
        {items.slice(0, half).map(tab)}
        {onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            onPress={onAction}
            style={[{ marginTop: -28 }, elevationStyle.fab]}
            className="bg-indigo active:bg-indigo-deep h-[54px] w-[54px] flex-row items-center justify-center rounded-full">
            <Icon name={actionIcon} size="xl" tone="invert" />
          </Pressable>
        ) : null}
        {items.slice(half).map(tab)}
      </View>
      {showIndicator ? <HomeIndicator /> : null}
    </View>
  );
}

/** 详情页底部固定主操作条 */
export function BottomActionBar({
  children,
  caption,
  className,
}: {
  children: ReactNode;
  caption?: ReactNode;
  className?: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cx(
        'border-hair/70 bg-paper/95 absolute right-0 bottom-0 left-0 z-30 border-t px-5 pt-3',
        className
      )}
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
      {children}
      {caption ? (
        <View className="mt-2 items-center">
          {typeof caption === 'string' ? <Micro>{caption}</Micro> : caption}
        </View>
      ) : null}
    </View>
  );
}
