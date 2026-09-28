/** 容器、列表、标签与空状态 */
import { useState } from 'react';
import { View } from 'react-native';

import {
  ActionRow,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  ListGroup,
  ListRow,
  Skeleton,
} from '@/components';
import { Caption, Micro } from '@/components/text';
import { recipeRows, taxonomyRows } from '@/fixtures/showcase';

import { ShowcaseStage } from './gallery';

const TONES = [
  { tone: 'card', label: 'Card' },
  { tone: 'deep', label: 'Deep' },
  { tone: 'fill', label: 'Fill' },
  { tone: 'tint', label: 'Tint' },
  { tone: 'lake', label: 'Lake' },
] as const;

export function SurfacesSection() {
  const [selected, setSelected] = useState('快手菜');
  return (
    <View className="gap-4">
      <ShowcaseStage label="SURFACE TONES" caption="同一结构，不同语义表面" tone="paper">
        <View className="flex-row flex-wrap gap-2">
          {TONES.map(({ tone, label }) => (
            <Card key={tone} tone={tone} className="min-w-[30%] flex-1" style={{ minHeight: 92 }}>
              <View className="flex-1 justify-between gap-3">
                <Icon name="utensils-crossed" size="md" tone={tone === 'lake' ? 'lake' : 'soft'} />
                <Micro size="text-[10px]" className="tracking-normal">
                  {label}
                </Micro>
              </View>
            </Card>
          ))}
        </View>
      </ShowcaseStage>
      <ShowcaseStage label="RECIPE LIST" caption="缩略图、说明与附件" contentClassName="p-0">
        <ListGroup className="border-0">
          {recipeRows.map((row) => (
            <ListRow
              key={row.title}
              leading={
                <View className="bg-tint rounded-thumb h-10 w-10 items-center justify-center">
                  <Icon name="utensils-crossed" size="sm" tone="accent" />
                </View>
              }
              title={row.title}
              subtitle={row.subtitle}
              value={row.value}
              accessory="chevron"
              onPress={() => setSelected(row.title)}
            />
          ))}
        </ListGroup>
      </ShowcaseStage>
      <ShowcaseStage
        label="SELECTION LIST"
        caption="单选、说明与破坏性操作"
        tone="paper"
        contentClassName="p-0">
        <ListGroup className="border-0">
          {taxonomyRows.map((row) => (
            <ListRow
              key={row.title}
              title={row.title}
              subtitle={row.subtitle}
              value={row.value}
              selected={selected === row.title}
              accessory="check"
              onPress={() => setSelected(row.title)}
            />
          ))}
          <ListRow title="删除这个分类" destructive onPress={() => {}} />
        </ListGroup>
      </ShowcaseStage>
      <ShowcaseStage label="BADGES & ACTIONS" caption="状态标签与卡片动作">
        <View className="gap-4">
          <View className="flex-row flex-wrap gap-2">
            <Badge>默认</Badge>
            <Badge tone="outline">描边</Badge>
            <Badge tone="accent">分类</Badge>
            <Badge tone="lake">完成</Badge>
            <Badge tone="gold">图表</Badge>
            <Badge tone="ink">强调</Badge>
            <Badge tone="danger">破坏</Badge>
          </View>
          <View className="border-hair rounded-group overflow-hidden border">
            <ActionRow
              icon={<Icon name="plus" size="md" tone="accent" />}
              onPress={() => {}}
              separator>
              新增分类
            </ActionRow>
            <ActionRow
              destructive
              icon={<Icon name="trash-2" size="md" tone="danger" />}
              onPress={() => {}}
              separator>
              清空全部
            </ActionRow>
            <ActionRow disabled onPress={() => {}}>
              不可用动作
            </ActionRow>
          </View>
        </View>
      </ShowcaseStage>
      <ShowcaseStage label="EMPTY STATE" caption="没有内容时也保持完整" tone="tint">
        <EmptyState
          icon={<Icon name="book-open" size="lg" tone="accent" />}
          title="还没有菜谱"
          description="把常做的菜收进来，之后点一下就能记录。"
          action={
            <Button size="sm" icon={<Icon name="plus" size="sm" tone="invert" />}>
              新建菜谱
            </Button>
          }
        />
      </ShowcaseStage>
      <ShowcaseStage label="LOADING" caption="与真实内容结构一致" tone="paper">
        <View className="flex-row gap-3">
          <Skeleton height={48} rounded={14} className="w-12" />
          <View className="flex-1 justify-center gap-2">
            <Skeleton height={16} rounded={8} className="w-[62%]" />
            <Skeleton height={12} rounded={8} className="w-[88%]" />
            <Skeleton height={12} rounded={8} className="w-[38%]" />
          </View>
        </View>
        <Caption size="text-[10px]" className="mt-3">
          列表加载占位
        </Caption>
      </ShowcaseStage>
    </View>
  );
}
