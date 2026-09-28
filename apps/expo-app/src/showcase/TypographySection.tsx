/** 字阶：七档角色 + 语气 + 表格数字 */
import { View } from 'react-native';

import {
  Body,
  Caption,
  Display,
  Editorial,
  Metric,
  Micro,
  Subhead,
  Title,
  Wordmark,
} from '@/components/text';
import { typeScale } from '@/theme';

import { ShowcaseStage } from './gallery';

const SAMPLES = [Metric, Display, Title, Subhead, Body, Caption, Micro] as const;

export function TypographySection() {
  return (
    <View className="gap-3">
      <ShowcaseStage label="TYPE SCALE" contentClassName="gap-3">
        {typeScale.map((t, i) => {
          const Sample = SAMPLES[i];
          return (
            <View key={t.token}>
              <Sample numberOfLines={1}>{t.sample}</Sample>
              <Caption size="text-[10px]">{t.token.replace('--text-', '')}</Caption>
            </View>
          );
        })}
      </ShowcaseStage>

      <ShowcaseStage label="TEXT ROLES" tone="ink" contentClassName="gap-3">
        <Wordmark className="text-title text-card" />
        <Editorial tone="invert">段落文本用于连续阅读，保持舒展的行高。</Editorial>
        <View className="flex-row flex-wrap gap-x-4 gap-y-2">
          <Body tone="accent">可交互</Body>
          <Body tone="lake">已完成</Body>
          <Body tone="danger">破坏操作</Body>
        </View>
        <View className="flex-row items-baseline gap-4">
          <Metric tone="invert">21</Metric>
          <Body tone="invert" tabular>
            1111
          </Body>
          <Caption size="text-[12px]" tone="invert">
            09:41
          </Caption>
        </View>
      </ShowcaseStage>
    </View>
  );
}
