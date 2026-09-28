/** 间距 / 圆角 / 阴影令牌 */
import { View } from 'react-native';

import { Body, Caption } from '@/components/text';
import { elevationStyle, elevation, radiusTokens, spacing } from '@/theme';

import { ShowcaseStage } from './gallery';

export function SpacingSection() {
  return (
    <View className="gap-3">
      <ShowcaseStage label="SPACING" tone="paper" contentClassName="gap-2">
        {spacing.map((s) => (
          <View key={s.px} className="flex-row items-center gap-3">
            <Body size="text-[10px]" tabular className="w-6">
              {s.px}
            </Body>
            <View className="bg-indigo/25 h-3 rounded-xs" style={{ width: s.px * 2 }} />
          </View>
        ))}
      </ShowcaseStage>

      <ShowcaseStage label="RADIUS" contentClassName="flex-row flex-wrap gap-3">
        {radiusTokens.map((r) => (
          <View key={r.name} className="w-[29%] items-center gap-1.5">
            <View className="border-hair bg-tint h-14 w-14 border" style={{ borderRadius: r.px }} />
            <Caption size="text-[10px]">{r.name}</Caption>
          </View>
        ))}
      </ShowcaseStage>

      <ShowcaseStage label="ELEVATION" tone="paper" contentClassName="flex-row flex-wrap gap-3">
        {elevation.map((e) => (
          <View
            key={e.name}
            className="border-hair/60 bg-card rounded-card h-20 w-[47%] justify-end border p-3"
            style={elevationStyle[e.name]}>
            <Body size="text-[11px]" weight="font-semibold">
              {e.name}
            </Body>
          </View>
        ))}
      </ShowcaseStage>
    </View>
  );
}
