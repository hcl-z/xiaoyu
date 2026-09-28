/** 颜色令牌：表面 / 文字 / 强调三组色板 */
import { View } from 'react-native';

import { Body } from '@/components/text';
import { colorGroups } from '@/theme';

import { ShowcaseStage } from './gallery';

export function ColorsSection() {
  return (
    <View className="gap-3">
      {colorGroups.map((group) => (
        <ShowcaseStage key={group.title} label={group.title} tone="paper">
          <View className="flex-row flex-wrap gap-2">
            {group.items.map((item) => (
              <View key={item.token} className="w-[31%] min-w-0 shrink-0 gap-1.5">
                <View
                  className="border-hair/70 rounded-control h-14 border"
                  style={{ backgroundColor: item.hex }}
                />
                <Body size="text-[10px]" weight="font-semibold" numberOfLines={1}>
                  {item.token}
                </Body>
                <Body size="text-[9px]" tone="muted" numberOfLines={1}>
                  {item.hex}
                </Body>
              </View>
            ))}
          </View>
        </ShowcaseStage>
      ))}
    </View>
  );
}
