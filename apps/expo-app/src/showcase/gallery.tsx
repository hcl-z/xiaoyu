import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Caption, Micro, Subhead } from '@/components/text';
import { elevationStyle } from '@/theme';

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

export function ShowcaseSection({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={{ rowGap: 12 }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12, paddingHorizontal: 4 }}>
        <View className="bg-ink h-7 w-7 items-center justify-center rounded-full">
          <Micro tone="invert" size="text-[10px]" className="tracking-normal">
            {index}
          </Micro>
        </View>
        <Subhead>{title}</Subhead>
      </View>
      {children}
    </View>
  );
}

const STAGE_TONE = {
  card: 'border-hair/80 bg-card',
  paper: 'border-hair/60 bg-paper-deep/70',
  tint: 'border-indigo/15 bg-tint',
  lake: 'border-lake/20 bg-lake-tint',
  ink: 'border-ink bg-ink',
} as const;

export function ShowcaseStage({
  label,
  caption,
  tone = 'card',
  children,
  className,
  contentClassName,
}: {
  label?: string;
  caption?: string;
  tone?: keyof typeof STAGE_TONE;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <View className={className} style={{ rowGap: 8 }}>
      {label || caption ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            columnGap: 12,
            paddingHorizontal: 4,
          }}>
          {label ? <Micro>{label}</Micro> : <View />}
          {caption ? (
            <Caption size="text-[11px]" numberOfLines={1}>
              {caption}
            </Caption>
          ) : null}
        </View>
      ) : null}
      <View
        className={cx('rounded-card', tone === 'card' && 'bg-card')}
        style={tone === 'card' ? elevationStyle.card : undefined}>
        <View
          testID="showcase-stage-clip-layer"
          className={cx(
            'rounded-card overflow-hidden border p-4',
            STAGE_TONE[tone],
            contentClassName
          )}>
          {children}
        </View>
      </View>
    </View>
  );
}
