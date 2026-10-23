/**
 * Design System Showcase
 * ------------------------------------------------------------------
 * 移动端组件展览：按类别分成独立舞台，集中检查组件本身。
 */
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components';
import { Caption, Display, Micro, Wordmark } from '@/components/text';

import { ChromeSection } from './ChromeSection';
import { ColorsSection } from './ColorsSection';
import { ControlsSection } from './ControlsSection';
import { DataSection } from './DataSection';
import { IconsSection } from './IconsSection';
import { InputCandidatesSection } from './InputCandidatesSection';
import { InputsSection } from './InputsSection';
import { MotionSection } from './MotionSection';
import { SpacingSection } from './SpacingSection';
import { SurfacesSection } from './SurfacesSection';
import { TypographySection } from './TypographySection';
import { ShowcaseSection } from './gallery';

export function Showcase() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="bg-paper"
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{
        width: '100%',
        maxWidth: 430,
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: Math.max(insets.top, 20) + 18,
        paddingBottom: Math.max(insets.bottom, 24) + 28,
        rowGap: 40,
      }}
      showsVerticalScrollIndicator={false}>
      <View style={{ rowGap: 20 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Wordmark className="text-title" />
          <Badge tone="ink">EXPO</Badge>
        </View>
        <View style={{ rowGap: 8 }}>
          <Micro>COMPONENT GALLERY</Micro>
          <Display>组件展览</Display>
          <Caption>原生控件、数据展示与交互动效</Caption>
        </View>
      </View>

      <ShowcaseSection index="01" title="颜色与字阶">
        <ColorsSection />
        <TypographySection />
      </ShowcaseSection>

      <ShowcaseSection index="02" title="按钮与选择">
        <ControlsSection />
      </ShowcaseSection>

      <ShowcaseSection index="03" title="输入">
        <InputsSection />
      </ShowcaseSection>

      <ShowcaseSection index="03b" title="输入形态候选 · 待选">
        <InputCandidatesSection />
      </ShowcaseSection>

      <ShowcaseSection index="04" title="容器与列表">
        <SurfacesSection />
      </ShowcaseSection>

      <ShowcaseSection index="05" title="数据展示">
        <DataSection />
      </ShowcaseSection>

      <ShowcaseSection index="06" title="导航与叠层">
        <ChromeSection />
      </ShowcaseSection>

      <ShowcaseSection index="07" title="动效">
        <MotionSection />
      </ShowcaseSection>

      <ShowcaseSection index="08" title="尺寸与图标">
        <SpacingSection />
        <IconsSection />
      </ShowcaseSection>
    </ScrollView>
  );
}
