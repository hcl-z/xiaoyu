/**
 * 我的：连续打卡热力图、累计统计、分类与标签管理、关于与账号。
 * 退出登录走 Alert 确认，确认后清空本地会话。
 */
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { NavBar } from '@/chrome';
import { Alert } from '@/chrome/overlays';
import { Badge, ListRow, Section } from '@/components/surfaces';
import { Heatmap, HeatmapLegend, Stat } from '@/components/data';
import { Icon } from '@/components/icon';
import { Body, Caption, Metric, Micro } from '@/components/text';
import { useStats, useTaxonomies } from '@/data/store';
import { todayISO } from '@/domain/date';
import { useSession } from '@/session';

import { useTabScreenPadding } from './layout-metrics';

export function ProfileScreen() {
  const router = useRouter();
  const { paddingTop, paddingBottom } = useTabScreenPadding();
  const { stats, loading } = useStats();
  const { categories, tags, loading: taxonomiesLoading } = useTaxonomies();
  const { user, isDemo, busy, signOut } = useSession();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [about, setAbout] = useState(false);

  const heat = useMemo(() => stats.days.map((d) => d.count), [stats.days]);
  const heatDays = useMemo(() => stats.days.map((d) => d.day), [stats.days]);
  const name = user?.name ?? '';

  return (
    <ScrollView
      className="bg-paper"
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop, paddingBottom, rowGap: 24 }}
      showsVerticalScrollIndicator={false}>
      <NavBar variant="large" largeTitle="我的" subtitle={`已坚持记录 ${stats.streak} 天`} />

      <View className="px-5">
        <Section padded>
          <View className="flex-row items-center gap-4">
            <View className="bg-tint h-14 w-14 shrink-0 items-center justify-center rounded-full">
              <Body tone="accent" size="text-title" weight="font-bold">
                {name.slice(0, 1)}
              </Body>
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-2">
                <Body numberOfLines={1} size="text-title" weight="font-bold" className="shrink">
                  {name}
                </Body>
                {isDemo ? <Badge tone="gray">演示账号</Badge> : null}
              </View>
              <Caption className="mt-0.5">
                {loading ? '统计中…' : `本月 ${stats.totals.activeDays} 天有记录`}
              </Caption>
            </View>
            <Badge tone="accent">
              <Metric size="text-[13px]">{String(stats.streak)}</Metric>
              {' 天'}
            </Badge>
          </View>
        </Section>
      </View>

      <View className="px-5">
        <Section title="最近 28 天" footer="轻点任意方格查看那天的记录" padded>
          {loading || heat.length === 0 ? (
            <Caption className="py-6 text-center">统计加载中…</Caption>
          ) : (
            <>
              <Heatmap
                values={heat}
                days={heatDays}
                selected={todayISO()}
                onSelect={(day) => router.push(`/today?day=${day}`)}
              />
              <View className="border-hair mt-3 flex-row items-center justify-between border-t pt-3">
                <Caption>{`${heat.filter((v) => v > 0).length} / ${heat.length} 天有记录`}</Caption>
                <HeatmapLegend />
              </View>
            </>
          )}
        </Section>
      </View>

      <View className="px-5">
        <Section padded>
          <View className="flex-row">
            <View className="flex-1">
              <Stat value={stats.totals.checkins} label="累计记录" tone="accent" />
            </View>
            <View className="border-hair flex-1 border-l">
              <Stat value={stats.totals.recipes} label="菜谱" />
            </View>
            <View className="border-hair flex-1 border-l">
              <Stat value={stats.totals.favorites} label="收藏" tone="lake" />
            </View>
          </View>
        </Section>
      </View>

      <View className="px-5">
        <Section title="内容管理" footer="分类与标签在菜谱编辑器和菜谱库筛选中通用">
          <ListRow
            leading={
              <View className="h-[22px] w-[22px] items-center justify-center">
                <Icon name="folder-tree" size="md" tone="accent" />
              </View>
            }
            title="分类管理"
            subtitle="菜谱库顶部的筛选项"
            value={taxonomiesLoading ? undefined : `${categories.length} 个`}
            accessory="chevron"
            onPress={() => router.push('/profile/categories')}
          />
          <ListRow
            leading={
              <View className="h-[22px] w-[22px] items-center justify-center">
                <Icon name="tags" size="md" tone="accent" />
              </View>
            }
            title="标签管理"
            subtitle="标记做法与场景，可多选"
            value={taxonomiesLoading ? undefined : `${tags.length} 个`}
            accessory="chevron"
            onPress={() => router.push('/profile/tags')}
          />
        </Section>
      </View>

      <View className="px-5">
        <Section title="关于">
          <ListRow
            leading={
              <View className="h-[22px] w-[22px] items-center justify-center">
                <Icon name="info" size="md" tone="accent" />
              </View>
            }
            title="关于 daily +"
            value="1.0.0"
            accessory="chevron"
            onPress={() => setAbout(true)}
          />
        </Section>
      </View>

      <View className="px-5">
        <Section
          title="账号"
          footer={
            isDemo ? '演示账号为公共数据，所有体验者都能看到' : '登录状态会在本设备保留 30 天'
          }>
          <ListRow
            leading={
              <View className="h-[22px] w-[22px] items-center justify-center">
                <Icon name="user-round" size="md" tone="accent" />
              </View>
            }
            title={name}
            subtitle={user?.email}
          />
          <ListRow
            leading={
              <View className="h-[22px] w-[22px] items-center justify-center">
                <Icon name="log-out" size="md" tone="danger" />
              </View>
            }
            title={busy ? '正在退出…' : '退出登录'}
            destructive
            onPress={() => setConfirmLogout(true)}
          />
        </Section>
      </View>

      <Micro className="px-4 text-center">DAILY + 1.0.0 (24)</Micro>

      <Alert
        open={about}
        title="daily +"
        message="菜谱管理与每日饮食打卡。想到就记，不用先归类。"
        cancelLabel="知道了"
        confirmLabel="查看系统"
        destructive={false}
        onCancel={() => setAbout(false)}
        onConfirm={() => {
          setAbout(false);
          router.push('/showcase');
        }}
      />

      <Alert
        open={confirmLogout}
        title="退出登录？"
        message="退出后需要重新登录，才能查看你的菜谱与饮食记录。"
        confirmLabel="退出"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          void signOut();
        }}
      />
    </ScrollView>
  );
}
