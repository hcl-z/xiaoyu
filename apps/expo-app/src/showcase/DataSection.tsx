/** 数据组件：把每类图形放进独立展示台 */
import { useState } from 'react';
import { View } from 'react-native';

import {
  Bar,
  Caption,
  Heatmap,
  HeatmapLegend,
  MeterRow,
  Metric,
  Ring,
  Sparkbars,
  Stat,
} from '@/components';
import { heatmap, mealStats, nutrition, weekBars } from '@/fixtures/showcase';
import { color } from '@/theme';

import { ShowcaseStage } from './gallery';

export function DataSection() {
  const [day, setDay] = useState(heatmap.selected);
  return (
    <View className="gap-4">
      <ShowcaseStage label="STATS" caption="紧凑关键指标">
        <View className="flex-row gap-2">
          {mealStats.map((stat) => (
            <Stat
              key={stat.label}
              className="flex-1"
              value={stat.value}
              label={stat.label}
              tone={stat.tone}
            />
          ))}
        </View>
      </ShowcaseStage>
      <ShowcaseStage label="PROGRESS RINGS" caption="完成度与单项状态" tone="tint">
        <View className="flex-row items-center justify-around gap-4">
          <Ring pct={0.66}>
            <Metric>2/3</Metric>
            <Caption size="text-[11px]">今日三餐</Caption>
          </Ring>
          <View className="items-center gap-2">
            <Ring pct={1} size={72} stroke={8} tone={color.lake}>
              <Caption size="text-[11px]" tone="lake">
                100%
              </Caption>
            </Ring>
            <Caption size="text-[10px]">饮水目标</Caption>
          </View>
        </View>
      </ShowcaseStage>
      <ShowcaseStage label="METERS" caption="营养值与普通进度条">
        <View className="gap-4">
          {nutrition.map((row) => (
            <MeterRow key={row.label} {...row} />
          ))}
          <View className="gap-1.5">
            <View className="flex-row justify-between">
              <Caption size="text-[11px]">烹饪进度</Caption>
              <Caption size="text-[11px]" tabular>
                38%
              </Caption>
            </View>
            <Bar pct={38} tone={color.gold} height={8} />
          </View>
        </View>
      </ShowcaseStage>
      <ShowcaseStage label="SPARKBARS" caption="最近 7 天" tone="paper">
        <Sparkbars values={weekBars.values} labels={weekBars.labels} height={64} highlightLast />
      </ShowcaseStage>
      <ShowcaseStage label="HEATMAP" caption="点击任意日期查看" tone="lake">
        <View className="gap-3">
          <Heatmap values={heatmap.values} days={heatmap.days} selected={day} onSelect={setDay} />
          <View className="flex-row items-center justify-between">
            <HeatmapLegend />
            <Caption size="text-[11px]" tone="lake">
              {day}
            </Caption>
          </View>
        </View>
      </ShowcaseStage>
    </View>
  );
}
