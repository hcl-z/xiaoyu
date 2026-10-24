/**
 * 我的：连续打卡热力图、累计统计、分类与标签管理、服务器与更新、关于与账号。
 * 退出登录走 Alert 确认，确认后清空本地会话。
 */
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { NavBar, Sheet } from '@/chrome';
import { Alert } from '@/chrome/overlays';
import { Button } from '@/components/button';
import { Badge, ListRow, Section } from '@/components/surfaces';
import { Heatmap, HeatmapLegend, Stat } from '@/components/data';
import { Icon } from '@/components/icon';
import { FieldError } from '@/components/inputs';
import { Body, Caption, Metric, Micro } from '@/components/text';
import {
  checkForUpdates,
  getUpdatesState,
  installUpdate,
  skipRelease,
  subscribeUpdates,
  updatesSupported,
  installedVersion,
} from '@/data/updates';
import { useStats, useTaxonomies } from '@/data/store';
import { todayISO } from '@/domain/date';
import { useSession } from '@/session';

import { useTabScreenPadding } from './layout-metrics';

export function ProfileScreen() {
  const router = useRouter();
  const { paddingTop, paddingBottom } = useTabScreenPadding();
  const { stats, loading } = useStats();
  const { categories, tags, loading: taxonomiesLoading } = useTaxonomies();
  const { user, busy, signOut } = useSession();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [updateSheet, setUpdateSheet] = useState(false);

  // 更新模块的状态是模块级单例，订阅变化重渲染这一页
  const [, setUpdateTick] = useState(0);
  useEffect(() => subscribeUpdates(() => setUpdateTick((n) => n + 1)), []);
  const updateState = getUpdatesState();

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
        <Section title="关于" footer="新版本发布在 GitHub Releases，Android 端支持应用内更新">
          <ListRow
            leading={
              <View className="h-[22px] w-[22px] items-center justify-center">
                <Icon name="info" size="md" tone="accent" />
              </View>
            }
            title="版本"
            value={installedVersion}
          />
          <ListRow
            leading={
              <View className="h-[22px] w-[22px] items-center justify-center">
                <Icon name="arrow-down" size="md" tone="accent" />
              </View>
            }
            title="检查更新"
            subtitle={
              updatesSupported ? '每天自动检查一次，也可现在手动检查' : '当前构建不支持应用内更新'
            }
            accessory={updatesSupported ? 'chevron' : 'none'}
            onPress={() => {
              if (!updatesSupported) return;
              void checkForUpdates();
              setUpdateSheet(true);
            }}
          />
        </Section>
      </View>

      <View className="px-5">
        <Section title="账号" footer="登录状态会在本设备保留 30 天">
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

      <Micro className="px-4 text-center">DAILY + {installedVersion}</Micro>

      <Sheet
        open={updateSheet}
        onClose={() => setUpdateSheet(false)}
        title="软件更新"
        subtitle={`当前版本 ${installedVersion}`}
        action={
          updateState.latest ? undefined : { label: '检查', onPress: () => void checkForUpdates() }
        }>
        <View className="gap-4 pb-2">
          {updateState.error ? <FieldError>{updateState.error}</FieldError> : null}

          {updateState.phase === 'checking' ? (
            <Caption>正在向 GitHub 检查新版本…</Caption>
          ) : updateState.phase === 'downloading' && updateState.latest ? (
            <View className="gap-2">
              <Caption>正在下载 {updateState.latest.version}，下载完会调起系统安装器…</Caption>
              <View className="bg-fill h-1.5 w-full overflow-hidden rounded-full">
                <View
                  className="bg-indigo h-full rounded-full"
                  style={{ width: `${Math.round(updateState.progress * 100)}%` }}
                />
              </View>
              <Caption className="u-num self-end">
                {Math.round(updateState.progress * 100)}%
              </Caption>
            </View>
          ) : updateState.latest ? (
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <Body weight="font-semibold">新版本 {updateState.latest.version}</Body>
                <Badge tone="accent">
                  {updateState.latest.size > 0
                    ? `${(updateState.latest.size / 1024 / 1024).toFixed(1)} MB`
                    : 'APK'}
                </Badge>
              </View>
              <Caption>{updateState.latest.notes}</Caption>
              <Button label="下载并安装" onPress={() => void installUpdate(updateState.latest!)}>
                下载并安装
              </Button>
              <Button
                variant="quiet"
                label="跳过此版本"
                onPress={() => {
                  void skipRelease(updateState.latest!.version);
                  setUpdateSheet(false);
                }}>
                跳过此版本
              </Button>
            </View>
          ) : updateState.checked ? (
            <Caption>已是最新版本。</Caption>
          ) : (
            <Caption>每次打开应用会自动检查一次；也可以点右上角「检查」现在查。</Caption>
          )}
        </View>
      </Sheet>

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
