/** 动效：每个展示台只强调一种运动语言 */
import { useState } from 'react';
import { View } from 'react-native';

import { Button, CheckCircle, Icon, Pill, Segmented, Toggle } from '@/components';
import { Caption, Micro } from '@/components/text';
import {
  Animated,
  FadeIn,
  Presence,
  PressableScale,
  ScaleIn,
  SlideIn,
  layoutTransition,
} from '@/motion';
import { color, elevationStyle, radius } from '@/theme';

import { ShowcaseStage } from './gallery';

function Block({ tone = 'card', label }: { tone?: 'card' | 'lake'; label: string }) {
  return (
    <View
      className={cx(
        'border-hair/80 rounded-card h-14 justify-center border px-4',
        tone === 'lake' ? 'bg-lake-tint' : 'bg-card'
      )}
      style={elevationStyle.card}>
      <Caption size="text-[11px]" tone={tone === 'lake' ? 'lake' : 'soft'}>
        {label}
      </Caption>
    </View>
  );
}

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

export function MotionSection() {
  const [seed, setSeed] = useState(0);
  const [present, setPresent] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('list');
  const [checked, setChecked] = useState(true);
  const [segment, setSegment] = useState<'a' | 'b' | 'c'>('a');

  return (
    <View className="gap-4">
      <ShowcaseStage label="ENTRY" caption="滑入、淡入与错峰" tone="paper">
        <View key={seed} className="gap-2">
          <SlideIn from="right">
            <Block label="Slide from right" />
          </SlideIn>
          <SlideIn from="up" delay={0.06}>
            <Block label="Slide from top" />
          </SlideIn>
          <FadeIn delay={0.12}>
            <Block label="Fade in" />
          </FadeIn>
          <Button variant="tonal" size="sm" onPress={() => setSeed((n) => n + 1)}>
            重播入场
          </Button>
        </View>
      </ShowcaseStage>
      <ShowcaseStage label="STAGGER" caption="小元素依次出现">
        <View className="flex-row items-center justify-between gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <ScaleIn key={String(seed) + '-' + i} from={0.4} delay={i * 0.04}>
              <View className="bg-tint h-11 w-11 items-center justify-center rounded-full">
                <Micro size="text-[10px]" className="tracking-normal">
                  {i + 1}
                </Micro>
              </View>
            </ScaleIn>
          ))}
        </View>
      </ShowcaseStage>
      <ShowcaseStage label="PRESENCE & PRESS" caption="出现、消失与按压回弹" tone="lake">
        <View className="gap-3">
          <Presence visible={present}>
            <Block tone="lake" label="Presence" />
          </Presence>
          <View className="flex-row items-center justify-between gap-3">
            <Toggle checked={present} onChange={setPresent} label="出现与消失" tone="accent" />
            <PressableScale
              scale={0.96}
              onPress={() => setSeed((n) => n + 1)}
              className="border-lake/20 bg-card rounded-control min-h-11 justify-center border px-4">
              <Caption size="text-[11px]" tone="lake">
                按住试试
              </Caption>
            </PressableScale>
          </View>
        </View>
      </ShowcaseStage>
      <ShowcaseStage label="LAYOUT" caption="列表与网格平滑变形">
        <View className="gap-3">
          <Segmented
            size="sm"
            value={layoutMode}
            onChange={setLayoutMode}
            options={[
              { value: 'list', label: '列表' },
              { value: 'grid', label: '网格' },
            ]}
          />
          <Animated.View
            layout={layoutTransition}
            style={layoutMode === 'list' ? { gap: 8 } : { flexDirection: 'row', gap: 8 }}>
            {['A', 'B', 'C'].map((label) => (
              <Animated.View
                key={label}
                layout={layoutTransition}
                style={[
                  {
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.control,
                    backgroundColor: color.fill,
                  },
                  layoutMode === 'list'
                    ? { height: 44, paddingHorizontal: 16, alignSelf: 'flex-start' }
                    : { height: 72, flex: 1 },
                ]}>
                <Caption size="text-body" tone="ink">
                  {label}
                </Caption>
              </Animated.View>
            ))}
          </Animated.View>
        </View>
      </ShowcaseStage>
      <ShowcaseStage label="SPRING STATES" caption="控件状态使用同一弹簧语言" tone="tint">
        <View className="gap-4">
          <Segmented
            value={segment}
            onChange={setSegment}
            options={[
              { value: 'a', label: '第一项' },
              { value: 'b', label: '第二项' },
              { value: 'c', label: '第三项' },
            ]}
          />
          <View className="flex-row flex-wrap items-center gap-4">
            <Toggle checked={checked} onChange={setChecked} label="弹簧开关" />
            <CheckCircle done={checked} onPress={() => setChecked((v) => !v)} label="完成态" />
            <Pill tone="lake" active={checked}>
              完成
            </Pill>
            <ScaleIn from={0.4} spring={{ damping: 16, stiffness: 420 }}>
              <View className="bg-lake h-12 w-12 items-center justify-center rounded-full">
                <Icon name="check" size="lg" tone="invert" strokeWidth={3} />
              </View>
            </ScaleIn>
          </View>
        </View>
      </ShowcaseStage>
    </View>
  );
}
