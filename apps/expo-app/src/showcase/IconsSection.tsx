/** 图标：受控图标集，四档尺寸 × 四种语义颜色 */
import { View } from 'react-native';

import { Icon } from '@/components/icon';
import { Body } from '@/components/text';
import { iconSamples } from '@/fixtures/showcase';

import { ShowcaseStage } from './gallery';

const SIZES = ['sm', 'md', 'lg', 'xl'] as const;
const TONES = ['muted', 'accent', 'lake', 'danger'] as const;
const TONE_ICON = ['search', 'plus', 'check', 'trash-2'] as const;

export function IconsSection() {
  return (
    <View className="gap-3">
      <ShowcaseStage label="SIZE & TONE" contentClassName="gap-5">
        <View className="flex-row items-end justify-around">
          {SIZES.map((size) => (
            <View key={size} className="items-center gap-2">
              <Icon name="utensils-crossed" size={size} tone="ink" />
              <Body size="text-[9px]" tone="muted">
                {size}
              </Body>
            </View>
          ))}
        </View>
        <View className="flex-row items-center justify-around">
          {TONES.map((tone, i) => (
            <Icon key={tone} name={TONE_ICON[i]} size="lg" tone={tone} />
          ))}
        </View>
      </ShowcaseStage>

      <ShowcaseStage label="ICON SET" tone="paper" contentClassName="flex-row flex-wrap gap-2">
        {iconSamples.map((name) => (
          <View
            key={name}
            className="border-hair/60 bg-card rounded-control w-[22%] shrink-0 items-center gap-2 border px-1 py-3">
            <Icon name={name} size="lg" tone="ink" />
            <Body size="text-[8px]" tone="muted" numberOfLines={1}>
              {name}
            </Body>
          </View>
        ))}
      </ShowcaseStage>
    </View>
  );
}
