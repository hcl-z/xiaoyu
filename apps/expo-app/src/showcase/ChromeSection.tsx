/** 外壳与叠层：展示外观，也保留真实触发 */
import { useState } from 'react';
import { View } from 'react-native';

import {
  Alert,
  BottomActionBar,
  BottomSheetTextInput,
  FullScreenModal,
  NavBar,
  Sheet,
  SuccessOverlay,
  TabBar,
} from '@/chrome';
import { Button, Card, FormRow, Icon, IconButton } from '@/components';
import { Caption } from '@/components/text';
import { tabItems } from '@/fixtures/showcase';

import { ShowcaseStage } from './gallery';

export function ChromeSection() {
  const [tab, setTab] = useState('today');
  const [alertOpen, setAlertOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [note, setNote] = useState('');

  return (
    <View className="gap-4">
      <ShowcaseStage
        label="LARGE NAVIGATION"
        caption="首页与聚合页"
        contentClassName="overflow-hidden p-0">
        <NavBar
          largeTitle="今天"
          subtitle="8 月 20 日 · 已记录 2 餐"
          trailing={<IconButton name="plus" label="新建菜谱" variant="soft" />}
        />
      </ShowcaseStage>
      <ShowcaseStage
        label="COMPACT NAVIGATION"
        caption="详情与编辑页"
        tone="paper"
        contentClassName="overflow-hidden p-0">
        <NavBar
          variant="compact"
          title="番茄牛腩饭"
          onBack={() => {}}
          trailing={<IconButton name="heart" label="收藏" variant="plain" />}
        />
      </ShowcaseStage>
      <ShowcaseStage
        label="TAB BAR"
        caption="主导航与中央动作"
        contentClassName="overflow-hidden p-0">
        <View className="h-32 justify-end">
          <TabBar
            items={tabItems}
            active={tab}
            onSelect={setTab}
            onAction={() => setSheetOpen(true)}
          />
        </View>
      </ShowcaseStage>
      <ShowcaseStage
        label="BOTTOM ACTION"
        caption="固定主操作"
        tone="paper"
        contentClassName="min-h-32 overflow-hidden p-0">
        <BottomActionBar>
          <Button block icon={<Icon name="check" size="md" tone="invert" />}>
            保存到菜谱库
          </Button>
        </BottomActionBar>
      </ShowcaseStage>
      <ShowcaseStage
        label="SUCCESS OVERLAY"
        caption="轻量、短暂的完成反馈"
        contentClassName="min-h-44 overflow-hidden p-0">
        <SuccessOverlay open={successOpen} title="已记录" caption="今天第 3 餐" />
        <View className="flex-1 items-center justify-center">
          <Button variant="tonal" onPress={() => setSuccessOpen(true)}>
            播放成功态
          </Button>
        </View>
      </ShowcaseStage>
      <ShowcaseStage label="OVERLAYS" caption="点击查看真实叠层" tone="tint">
        <View className="gap-2">
          <Button block variant="secondary" onPress={() => setSheetOpen(true)}>
            打开底部弹层
          </Button>
          <Button block variant="secondary" onPress={() => setModalOpen(true)}>
            打开全屏任务层
          </Button>
          <Button block variant="destructive" onPress={() => setAlertOpen(true)}>
            打开删除确认
          </Button>
        </View>
      </ShowcaseStage>

      <Alert
        open={alertOpen}
        title="删除「番茄牛腩饭」？"
        message="删除后历史记录仍会保留，但菜谱本身无法恢复。"
        confirmLabel="删除"
        onConfirm={() => setAlertOpen(false)}
        onCancel={() => setAlertOpen(false)}
      />
      <FullScreenModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新建菜谱"
        subtitle="必填：菜名与分类"
        trailing={{
          icon: 'check',
          label: '保存',
          tone: 'accent',
          onPress: () => setModalOpen(false),
        }}
        footer={
          <Button block variant="secondary" onPress={() => setModalOpen(false)}>
            放弃并关闭
          </Button>
        }>
        <View className="m-4 gap-2.5">
          <FormRow label="菜名">
            <Caption size="text-body" tone="ink">
              番茄牛腩饭
            </Caption>
          </FormRow>
          <FormRow label="分类">
            <Caption size="text-body" tone="ink">
              家常菜
            </Caption>
          </FormRow>
          <FormRow label="时长">
            <Caption size="text-body" tone="ink">
              45 分钟
            </Caption>
          </FormRow>
        </View>
      </FullScreenModal>
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="记录这一餐"
        subtitle="拖拽可停靠在 55% 与 90%"
        action={{ label: '保存', onPress: () => setSheetOpen(false) }}
        footer={
          <Button block onPress={() => setSheetOpen(false)}>
            完成
          </Button>
        }>
        <View className="gap-3">
          <View className="gap-2.5">
            <FormRow label="菜名">
              <Caption size="text-body" tone="ink">
                番茄牛腩饭
              </Caption>
            </FormRow>
            <FormRow label="用时">
              <Caption size="text-body" tone="ink">
                30 分钟
              </Caption>
            </FormRow>
          </View>
          <Card className="py-3">
            <BottomSheetTextInput
              value={note}
              onChangeText={setNote}
              placeholder="写点什么（键盘会推动弹层）"
              placeholderTextColor="rgba(99,99,102,0.7)"
              className="text-body text-ink min-h-11"
              multiline
            />
          </Card>
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} className="py-3">
              <Caption size="text-[12px]">{'滚动内容 ' + (i + 1)}</Caption>
            </Card>
          ))}
        </View>
      </Sheet>
    </View>
  );
}
