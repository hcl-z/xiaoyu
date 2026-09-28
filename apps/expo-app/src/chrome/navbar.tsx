/**
 * NavBar · HomeIndicator
 * ------------------------------------------------------------------
 * Web 的 chrome.tsx 里，NavBar 有 sticky / transparent 两个滚动相关开关；
 * 原生由导航容器（Expo Router 的 Stack header）负责吸顶，
 * 所以这里只保留视觉与结构契约，不再复制 sticky 语义。
 */
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { alpha, layout } from '@/theme';

import { Icon } from '@/components/icon';
import { Body, Caption, Display } from '@/components/text';

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

/** 底部 Home 指示条：Web 画一条假的，原生只在没有系统指示条的设备上补 */
export function HomeIndicator({ className }: { className?: string }) {
  return (
    <View
      className={cx('items-center pt-1 pb-1.5', className)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={{ height: 5, width: 118, borderRadius: 2.5, backgroundColor: alpha.ink25 }} />
    </View>
  );
}

export type NavBarProps = {
  variant?: 'large' | 'compact';
  title?: string;
  largeTitle?: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** 紧凑范式下省略玻璃底与下沿发丝线 */
  transparent?: boolean;
  className?: string;
};

export function NavBar({
  variant = 'large',
  title,
  largeTitle,
  subtitle,
  onBack,
  backLabel = '返回',
  leading,
  trailing,
  transparent = false,
  className,
}: NavBarProps) {
  if (variant === 'compact') {
    return (
      <View
        className={cx(
          'z-30 flex-row items-center justify-between gap-2 px-3',
          !transparent && 'border-hair/70 bg-paper/95 border-b',
          className
        )}
        style={{ height: layout.navH }}>
        <View className="min-w-[84px] flex-row items-center">
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={backLabel || '返回'}
              onPress={onBack}
              className="-ml-1 flex-row items-center gap-0.5 py-2 pr-2 active:opacity-50">
              <Icon name="chevron-left" size="lg" tone="accent" strokeWidth={2.2} />
              {backLabel ? (
                <Body tone="accent" weight="font-medium">
                  {backLabel}
                </Body>
              ) : null}
            </Pressable>
          ) : (
            leading
          )}
        </View>
        {title ? (
          <Body weight="font-semibold" numberOfLines={1} className="min-w-0 flex-1 text-center">
            {title}
          </Body>
        ) : (
          <View className="flex-1" />
        )}
        <View className="min-w-[84px] flex-row items-center justify-end gap-2">{trailing}</View>
      </View>
    );
  }

  return (
    <View className={cx('flex-row items-start justify-between gap-4 px-5 pt-3', className)}>
      <View className="min-w-0 flex-1">
        {typeof (largeTitle ?? title) === 'string' ? (
          <Display>{largeTitle ?? title}</Display>
        ) : (
          (largeTitle ?? title)
        )}
        {subtitle ? (
          typeof subtitle === 'string' ? (
            <Caption className="mt-2">{subtitle}</Caption>
          ) : (
            subtitle
          )
        ) : null}
      </View>
      {trailing ? <View className="shrink-0 flex-row items-center gap-2">{trailing}</View> : null}
    </View>
  );
}
