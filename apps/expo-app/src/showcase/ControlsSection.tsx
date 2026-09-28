/** 按钮与控件：按真实移动端场景分组展示 */
import { useState } from 'react';
import { View } from 'react-native';

import {
  Button,
  buttonIconSize,
  CheckCircle,
  FabButton,
  Icon,
  IconButton,
  Pill,
  Segmented,
  Stepper,
  Toggle,
  type ButtonSize,
} from '@/components';
import { Caption, Micro } from '@/components/text';

import { ShowcaseStage } from './gallery';

const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];
const PILLS = ['家常菜', '快手菜', '汤羹', '烘焙'];

function SampleLabel({ children }: { children: string }) {
  return (
    <Micro size="text-[10px]" className="tracking-normal">
      {children}
    </Micro>
  );
}

export function ControlsSection() {
  const [segment, setSegment] = useState<'day' | 'week' | 'month'>('week');
  const [lake, setLake] = useState(true);
  const [accent, setAccent] = useState(false);
  const [servings, setServings] = useState(2);
  const [checks, setChecks] = useState([true, false, false]);
  const [pills, setPills] = useState<string[]>(['家常菜', '快手菜']);

  const togglePill = (label: string) =>
    setPills((current) =>
      current.includes(label) ? current.filter((p) => p !== label) : [...current, label]
    );

  return (
    <View className="gap-4">
      <ShowcaseStage label="PRIMARY ACTIONS" caption="最常见的移动端操作" tone="tint">
        <View className="gap-3">
          <Button block icon={<Icon name="check" size="md" tone="invert" />}>
            保存到菜谱库
          </Button>
          <View className="flex-row gap-2">
            <Button className="flex-1" variant="secondary">
              稍后再说
            </Button>
            <Button
              className="flex-1"
              variant="tonal"
              iconRight={<Icon name="chevron-right" size="md" tone="accent" />}>
              下一步
            </Button>
          </View>
        </View>
      </ShowcaseStage>

      <ShowcaseStage label="BUTTON FAMILY" caption="尺寸、层级与状态">
        <View className="gap-4">
          <View className="gap-2">
            <SampleLabel>尺寸</SampleLabel>
            <View className="flex-row flex-wrap items-center gap-2">
              {SIZES.map((size) => (
                <Button
                  key={size}
                  size={size}
                  icon={<Icon name="plus" size={buttonIconSize(size)} tone="invert" />}>
                  {size.toUpperCase()}
                </Button>
              ))}
            </View>
          </View>
          <View className="gap-2">
            <SampleLabel>层级</SampleLabel>
            <View className="flex-row flex-wrap gap-2">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="secondary">
                Secondary
              </Button>
              <Button size="sm" variant="tonal">
                Tonal
              </Button>
              <Button size="sm" variant="gray">
                Gray
              </Button>
              <Button size="sm" variant="ghost">
                Ghost
              </Button>
              <Button size="sm" variant="quiet">
                Quiet
              </Button>
              <Button size="sm" variant="plain">
                Plain
              </Button>
              <Button size="sm" variant="destructive">
                Delete
              </Button>
            </View>
          </View>
          <View className="gap-2">
            <SampleLabel>状态</SampleLabel>
            <View className="flex-row flex-wrap gap-2">
              <Button size="sm" loading>
                保存中
              </Button>
              <Button size="sm" disabled>
                已禁用
              </Button>
            </View>
          </View>
        </View>
      </ShowcaseStage>

      <ShowcaseStage label="INVERSE" caption="深色表面" tone="ink">
        <View className="flex-row flex-wrap items-center gap-2">
          <Button variant="inverse" size="sm">
            反色按钮
          </Button>
          <IconButton name="plus" label="新建" variant="invert" />
          <IconButton name="x" label="关闭" variant="glass" />
          <Caption tone="invert" size="text-[11px]" className="opacity-70">
            用于图片或深色叠层
          </Caption>
        </View>
      </ShowcaseStage>

      <ShowcaseStage label="ICON ACTIONS" caption="40–48pt 触控区">
        <View className="flex-row flex-wrap items-center gap-3">
          <IconButton name="heart" label="收藏" variant="card" />
          <IconButton name="pencil" label="编辑" variant="soft" />
          <IconButton name="search" label="搜索" variant="fill" />
          <IconButton name="info" label="说明" variant="plain" />
          <FabButton onPress={() => {}} label="新建菜谱">
            <Icon name="plus" size="xl" tone="invert" />
          </FabButton>
        </View>
      </ShowcaseStage>

      <ShowcaseStage label="FILTERS" caption="多选标签与单选分段" tone="paper">
        <View className="gap-4">
          <View className="flex-row flex-wrap gap-2">
            {PILLS.map((label) => (
              <Pill key={label} active={pills.includes(label)} onPress={() => togglePill(label)}>
                {label}
              </Pill>
            ))}
            <Pill size="sm" tone="lake" active>
              已完成
            </Pill>
            <Pill size="sm" tone="neutral">
              中性
            </Pill>
          </View>
          <Segmented
            value={segment}
            onChange={setSegment}
            options={[
              { value: 'day', label: '日' },
              { value: 'week', label: '周' },
              { value: 'month', label: '月' },
            ]}
          />
          <Segmented
            size="sm"
            value={segment}
            onChange={setSegment}
            options={[
              { value: 'day', label: '日', icon: <Icon name="clock" size="sm" tone="muted" /> },
              {
                value: 'week',
                label: '周',
                icon: <Icon name="chart-column" size="sm" tone="muted" />,
              },
              {
                value: 'month',
                label: '月',
                icon: <Icon name="calendar-check" size="sm" tone="muted" />,
              },
            ]}
          />
        </View>
      </ShowcaseStage>

      <ShowcaseStage label="SELECTION" caption="开关、步进与完成态">
        <View className="gap-4">
          <View className="flex-row flex-wrap items-center justify-between gap-4">
            <View className="items-center gap-1.5">
              <Toggle checked={lake} onChange={setLake} label="完成提醒" />
              <Caption size="text-[10px]">提醒</Caption>
            </View>
            <View className="items-center gap-1.5">
              <Toggle checked={accent} onChange={setAccent} label="自动同步" tone="accent" />
              <Caption size="text-[10px]">同步</Caption>
            </View>
            <View className="items-center gap-1.5">
              <Stepper
                value={servings}
                onChange={setServings}
                min={1}
                max={9}
                suffix=" 份"
                label="份数"
              />
              <Caption size="text-[10px]">步进器</Caption>
            </View>
          </View>
          <View className="flex-row items-center gap-4">
            {checks.map((done, i) => (
              <View key={i} className="items-center gap-1.5">
                <CheckCircle
                  done={done}
                  label={'第 ' + (i + 1) + ' 餐'}
                  onPress={() => setChecks((c) => c.map((v, index) => (index === i ? !v : v)))}
                />
                <Caption size="text-[10px]">{i + 1}</Caption>
              </View>
            ))}
          </View>
        </View>
      </ShowcaseStage>
    </View>
  );
}
