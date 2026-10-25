/**
 * 今日：周历条与 Hero 完成度环在顶部合为一张大卡，可浏览任意过去日期；
 * 未来日期禁用「记录」、改为「安排」。统计只看已实做的记录。
 *
 * 时间轴按餐段分簇（早 / 午 / 下午茶 / 晚 / 夜宵），簇内按时间排开；
 * 今天在对应位置插一条「现在」标线。安排 chips 只在看今天时出现。
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Alert, NavBar } from '@/chrome';
import { useCheckinSheet } from '@/chrome/checkin';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { RemoteImage } from '@/components/remote-image';
import { Badge, Card, EmptyState, Section, SectionHeader, Skeleton } from '@/components/surfaces';
import { Pill } from '@/components/controls';
import { Body, Caption, Micro, Subhead } from '@/components/text';
import { useCheckinRange, useCheckins, useStats } from '@/data/store';
import type { Checkin } from '@/data/types';
import { mealOfTime, type MealGroup } from '@/domain/meal';
import { WEEKDAYS, parseDay, shiftDay, todayISO, weekOf } from '@/domain/date';
import { SwapIn, useSequenceDirection } from '@/motion';
import { useSession } from '@/session';
import { color } from '@/theme';

import { BowlMark } from '@/brand/bowl-mark';
import { useTabScreenPadding } from './layout-metrics';
import { TodayHero } from './today-hero';

/** 周历条可往后看多远（天），给「安排下周吃什么」留出余地 */
const PLAN_HORIZON = 28;

export function TodayScreen() {
  const params = useLocalSearchParams<{
    day?: string;
    checkin?: string;
    recipe?: string;
  }>();
  const router = useRouter();
  const { paddingTop, paddingBottom } = useTabScreenPadding();
  const sheet = useCheckinSheet();

  const today = todayISO();
  const maxDay = shiftDay(today, PLAN_HORIZON);

  /** 深链 ?day=YYYY-MM-DD：只接受格式正确且未超出计划范围的值 */
  const rawParam = params.day;
  const requestedDay =
    typeof rawParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawParam) && rawParam <= maxDay
      ? rawParam
      : null;

  const [dayOverride, setDayOverride] = useState<string | null>(null);
  /** 参数变化时丢弃上一次的手动选择（React 官方的「props 变化时调整 state」写法） */
  const [seenParam, setSeenParam] = useState(requestedDay);
  if (seenParam !== requestedDay) {
    setSeenParam(requestedDay);
    setDayOverride(null);
  }
  const day = dayOverride ?? requestedDay ?? today;

  const history = useCheckins(day);
  const { stats, refresh: refreshStats } = useStats();
  const { user } = useSession();
  /**
   * 整个可安排区间（今天到 PLAN_HORIZON）的安排。
   * 拉满区间是因为周历上的「已安排」标记要覆盖所有能排的日子；
   * 「接下来的安排」chips 再按未来七天截取。
   */
  const plannedRange = useCheckinRange(shiftDay(today, 1), maxDay);

  /* 下拉刷新：当天记录、安排区间、统计一次拉齐 */
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    void Promise.all([history.refresh(), plannedRange.refresh(), refreshStats()])
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  };

  const setActiveDay = sheet.setActiveDay;

  /* 让 FAB 知道当前在看哪一天 */
  useEffect(() => {
    setActiveDay(day);
  }, [day, setActiveDay]);

  /* 深链 ?checkin=1 —— /checkin 重定向后自动展开弹层 */
  const handledDeepLink = useRef(false);
  useEffect(() => {
    if (handledDeepLink.current || !params.checkin) return;
    handledDeepLink.current = true;
    sheet.openCheckin({
      recipe: typeof params.recipe === 'string' ? params.recipe : undefined,
    });
    router.setParams({ checkin: undefined, recipe: undefined });
  }, [params.checkin, params.recipe, router, sheet]);

  const isToday = day === today;
  const isFuture = day > today;

  /**
   * 已落地视图：切日期时数据没到之前，时间线整块冻结在上一份渲染上，
   * 数据到位后连同 swapKey 一次性换入——否则空日子会先滑入旧卡片、
   * 响应回来再跳成空态，卡片「出现又消失」。
   */
  const [settled, setSettled] = useState<{ day: string; list: Checkin[] } | null>(null);
  /* 数据落地就在渲染期记一份快照（React 官方的「props 变化时调整 state」写法） */
  if (!history.loading && settled?.day !== day) {
    setSettled({ day, list: history.checkins });
  }
  const view =
    settled && history.loading && settled.day !== day ? settled : { day, list: history.checkins };
  const viewDay = view.day;
  const viewCheckins = view.list;
  const viewIsToday = viewDay === today;
  const viewIsFuture = viewDay > today;

  /** 已实做与计划两组分开（按正在展示的那份数据） */
  const done = useMemo(
    () => viewCheckins.filter((c) => !c.planned).sort((a, b) => a.time.localeCompare(b.time)),
    [viewCheckins]
  );
  const planned = useMemo(
    () => viewCheckins.filter((c) => c.planned).sort((a, b) => a.time.localeCompare(b.time)),
    [viewCheckins]
  );
  const upcomingPlans = useMemo(
    () =>
      plannedRange.checkins
        .filter((c) => c.planned && c.day <= shiftDay(today, 7))
        .sort((a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time))
        .slice(0, 8),
    [plannedRange.checkins, today]
  );

  /** 「现在」在当天时间轴上的位置：不做秒级刷新，切换日期时重算就够 */
  const [clock, setClock] = useState(() => {
    const d = new Date();
    return { day, minutes: d.getHours() * 60 + d.getMinutes() };
  });
  if (clock.day !== day) {
    const d = new Date();
    setClock({ day, minutes: d.getHours() * 60 + d.getMinutes() });
  }
  const nowTime = `${String(Math.floor(clock.minutes / 60)).padStart(2, '0')}:${String(
    clock.minutes % 60
  ).padStart(2, '0')}`;

  const hasEntries = done.length > 0 || planned.length > 0;
  /** 骨架只在首次加载（连上一份视图都没有）时出现；切日期靠冻结视图过渡 */
  const showSkeleton = history.loading && !hasEntries && settled === null;

  /**
   * 餐段簇：条目先全局按时间排好，逐条落入所属餐段；
   * 连续同段自然合并（同一天的夜宵可能一头一尾各出现一次，位置依然正确）。
   */
  const clusters = useMemo<MealCluster[]>(() => {
    const entries = [...done, ...planned].sort(
      (a, b) => a.time.localeCompare(b.time) || Number(a.planned) - Number(b.planned)
    );
    const out: MealCluster[] = [];
    let current: MealCluster | null = null;
    let nowPlaced = false;
    for (const item of entries) {
      const group = mealOfTime(item.time);
      if (!current || current.group.key !== group.key) {
        current = { group, items: [] };
        out.push(current);
      }
      if (viewIsToday && !nowPlaced && item.time > nowTime) {
        current.items.push({ kind: 'now' });
        nowPlaced = true;
      }
      current.items.push({ kind: 'entry', item });
    }
    if (viewIsToday && !nowPlaced && current) current.items.push({ kind: 'now' });
    return out;
  }, [done, planned, viewIsToday, nowTime]);

  const headLabel = viewIsFuture ? '这天' : viewIsToday ? '今日' : '当日';
  const headSummary = viewIsFuture
    ? planned.length > 0
      ? `${planned.length} 道安排`
      : '还没有安排'
    : done.length > 0
      ? `${done.length} 条记录`
      : planned.length > 0
        ? `${planned.length} 道安排`
        : '还没有记录';

  const week = useMemo(() => weekOf(day), [day]);
  const weekCounts = useMemo(() => {
    const map = new Map(stats.days.map((d) => [d.day, d.count]));
    return week.map((d) => map.get(d) ?? 0);
  }, [stats.days, week]);
  const weekPlanned = useMemo(() => {
    const set = new Set(plannedRange.checkins.filter((c) => c.planned).map((c) => c.day));
    return week.map((d) => set.has(d));
  }, [plannedRange.checkins, week]);

  const select = (next: string) => {
    if (next > maxDay) return;
    setDayOverride(next);
    router.setParams({ day: next === today ? undefined : next });
  };

  /**
   * 日期切换方向：ISO 日期字符串的字典序就是时间序，
   * 所以往后一天新内容从右侧进、往前一天从左侧进。
   */
  const dayDirection = useSequenceDirection(viewDay);

  const dateLabel = isToday
    ? `${parseDay(day).getMonth() + 1} 月 ${parseDay(day).getDate()} 日 · 星期${WEEKDAYS[parseDay(day).getDay()]}`
    : `${parseDay(day).getFullYear()} 年 ${parseDay(day).getMonth() + 1} 月 ${parseDay(day).getDate()} 日${
        isFuture ? ' · 将来' : ''
      }`;

  /* 时间线上一键确认计划失败时要能被看见，而不是无声无息 */
  const [planError, setPlanError] = useState<string | null>(null);
  const confirmPlan = (item: Checkin) => {
    void sheet.confirmPlan(item).catch(() => {
      setPlanError('确认失败，请检查网络后再试一次');
    });
  };

  return (
    <ScrollView
      className="bg-paper"
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop, paddingBottom, rowGap: 24 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={color.accent}
          colors={[color.accent]}
          progressBackgroundColor={color.card}
        />
      }>
      <NavBar
        variant="large"
        largeTitle={
          isToday ? '今天' : `${parseDay(day).getMonth() + 1}月${parseDay(day).getDate()}日`
        }
        subtitle={dateLabel}
        trailing={
          isToday ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="我的"
              onPress={() => router.push('/profile')}
              className="bg-fill active:bg-fill-deep h-8 w-8 items-center justify-center rounded-full">
              <Body tone="accent" size="text-[14px]" weight="font-semibold">
                {(user?.name ?? '我').slice(0, 1)}
              </Body>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="回到今天"
              onPress={() => select(today)}
              hitSlop={8}
              className="px-2 py-1">
              <Body tone="accent" size="text-[15px]">
                今天
              </Body>
            </Pressable>
          )
        }
      />

      {/* Hero：完成度环 + 连续记录 + 周历条 */}
      <TodayHero
        day={day}
        today={today}
        maxDay={maxDay}
        streak={stats.streak}
        monthActiveDays={stats.totals.activeDays}
        done={done}
        planned={planned}
        week={week}
        weekCounts={weekCounts}
        weekPlanned={weekPlanned}
        onSelect={select}
      />

      {/* 时间轴：按餐段分簇，整块内容跟着 day 换批 */}
      <SwapIn swapKey={viewDay} direction={dayDirection} style={{ rowGap: 24 }}>
        {hasEntries || showSkeleton ? (
          <View className="px-5">
            <SectionHeader
              label={headLabel}
              trailing={showSkeleton ? null : <Caption tabular>{headSummary}</Caption>}
            />
            <Card padded={false}>
              {showSkeleton ? (
                <TimelineSkeleton />
              ) : (
                clusters.map((cluster, ci) => (
                  <View key={`${cluster.group.key}-${ci}`} style={{ paddingBottom: 10 }}>
                    <ClusterHeader
                      group={cluster.group}
                      count={cluster.items.filter((n) => n.kind === 'entry').length}
                    />
                    {cluster.items.map((node, i) =>
                      node.kind === 'now' ? (
                        <NowMark key="now" />
                      ) : (
                        <MealRow
                          key={node.item.id}
                          item={node.item}
                          group={cluster.group}
                          separated={i > 0}
                          isFuture={isFuture}
                          onConfirm={() => confirmPlan(node.item)}
                          onPress={() => sheet.openCheckin({ day: viewDay, existing: node.item })}
                        />
                      )
                    )}
                  </View>
                ))
              )}
            </Card>
            <Caption className="mt-2 px-1">
              {isFuture
                ? '到那天在这里确认，才计入打卡与制作次数'
                : '按用餐时间排序 · 轻点记录可修改或删除'}
            </Caption>
          </View>
        ) : history.error && !showSkeleton ? (
          /* 拉取失败不是「这天真没记」：给一条明确的失败态与重试出口 */
          <View className="px-5">
            <Section>
              <EmptyState
                icon={<Icon name="circle-alert" size="xl" tone="danger" />}
                title="没能加载这一天"
                description="网络不太顺，内容没有取到；下拉或点这里再试一次。"
                action={
                  <Button size="sm" onPress={() => void history.refresh()}>
                    重试
                  </Button>
                }
              />
            </Section>
          </View>
        ) : (
          /* 空状态：把「现在」的位置让给一句邀请 */
          <DayEmptyState
            isToday={viewIsToday}
            isFuture={viewIsFuture}
            onRecord={() => sheet.openCheckin({ day: viewDay })}
            onPhoto={() => sheet.openPhotoCheckin({ day: viewDay })}
          />
        )}

        {/* 看今天时预告未来一周的安排，点进去就是那天 */}
        {viewIsToday && upcomingPlans.length > 0 ? (
          <View>
            <View className="px-5">
              <SectionHeader
                label="接下来的安排"
                trailing={<Caption tone="muted">{upcomingPlans.length} 道 · 未来七天</Caption>}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
              {upcomingPlans.map((item) => (
                <Pill
                  key={item.id}
                  tone="lake"
                  onPress={() => select(item.day)}
                  className="max-w-[220px]">
                  <Caption numberOfLines={1}>
                    {WEEKDAYS[parseDay(item.day).getDay()]} · {item.title}
                  </Caption>
                </Pill>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </SwapIn>

      <Alert
        open={planError !== null}
        title="没能确认这顿"
        message={planError ?? ''}
        confirmLabel="知道了"
        onCancel={() => setPlanError(null)}
        onConfirm={() => setPlanError(null)}
      />
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/* 餐段时间线                                                           */
/* ------------------------------------------------------------------ */

type ClusterItem = { kind: 'entry'; item: Checkin } | { kind: 'now' };
type MealCluster = { group: MealGroup; items: ClusterItem[] };

/** 行首缩进：与文字左缘对齐，簇内分隔线也从这里开始 */
const ROW_LEAD = 88;

function ClusterHeader({ group, count }: { group: MealGroup; count: number }) {
  return (
    <View
      className="flex-row items-center px-4"
      style={{ paddingTop: 14, paddingBottom: 6, gap: 4 }}>
      <View className="bg-tint h-[30px] w-[30px] items-center justify-center rounded-full">
        <Icon name={group.icon} size="md" tone="accent" />
      </View>
      <Body size="text-[16px]" weight="font-semibold">
        {group.label}
      </Body>
      <View className="bg-fill ml-1 rounded-full px-2 py-0.5">
        <Micro tone="muted">{count}</Micro>
      </View>
    </View>
  );
}

function MealRow({
  item,
  group,
  separated,
  isFuture,
  onConfirm,
  onPress,
}: {
  item: Checkin;
  group: MealGroup;
  separated: boolean;
  isFuture: boolean;
  onConfirm: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.planned ? `修改计划 ${item.title}` : `修改 ${item.title}`}
      onPress={onPress}
      className="active:bg-fill/60 relative w-full">
      {separated ? (
        <View
          className="bg-hair absolute"
          style={{ left: ROW_LEAD, right: 0, top: 0, height: 1 }}
        />
      ) : null}
      <View
        className="flex-row items-center"
        style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        {item.photoPath ? (
          <RemoteImage
            src={item.photoPath}
            accessibilityLabel="打卡照片"
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: color.fill,
            }}
          />
        ) : (
          <View
            className="bg-tint h-10 w-10 items-center justify-center rounded-full"
            style={{ opacity: item.planned ? 0.55 : 1 }}>
            <Icon name={group.icon} size="lg" tone="accent" />
          </View>
        )}

        <View className="min-w-0 flex-1" style={{ marginLeft: 12 }}>
          <Body
            numberOfLines={1}
            size="text-[16px]"
            weight="font-semibold"
            tone={item.planned ? 'soft' : 'ink'}>
            {item.title}
          </Body>
          {item.note ? (
            <Caption numberOfLines={1} tone="muted" className="mt-0.5">
              {item.note}
            </Caption>
          ) : null}
        </View>

        {/* 已记录的行不加箭头：整行可点已经足够，箭头会稀释「吃了」键 */}
        {item.planned ? (
          isFuture ? (
            <Badge tone="lake">计划</Badge>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`确认吃了 ${item.title}`}
              onPress={onConfirm}
              className="bg-lake-tint rounded-control h-8 flex-row items-center gap-1 px-2.5 active:opacity-70">
              <Icon name="check" size="sm" tone="lake" strokeWidth={2.6} />
              <Body tone="lake" size="text-[13px]" weight="font-semibold">
                吃了
              </Body>
            </Pressable>
          )
        ) : null}
      </View>
    </Pressable>
  );
}

/** 「现在」标线：实心小药丸，醒目地卡在它该在的位置 */
function NowMark() {
  return (
    <View
      className="flex-row items-center"
      style={{ paddingHorizontal: 16, paddingVertical: 7, gap: 8 }}>
      <View
        className="flex-row items-center rounded-full"
        style={{ backgroundColor: color.accent, paddingHorizontal: 9, height: 22 }}>
        <Body tone="invert" size="text-micro" weight="font-semibold">
          现在
        </Body>
      </View>
      <View
        className="h-[2px] flex-1 rounded-full"
        style={{ backgroundColor: `${color.accent}2E` }}
      />
    </View>
  );
}

function TimelineSkeleton() {
  return (
    <View style={{ paddingTop: 12, paddingBottom: 6, rowGap: 14 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} className="flex-row items-center" style={{ paddingHorizontal: 16, gap: 12 }}>
          <Skeleton className="h-9 w-9" rounded={99} />
          <View className="flex-1" style={{ rowGap: 6 }}>
            <Skeleton className="h-3.5 w-28" rounded={4} />
            <Skeleton className="h-2.5 w-20" rounded={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 空状态                                                               */
/* ------------------------------------------------------------------ */

/**
 * 一天没有任何内容时的兜底。
 * 今天 / 过去：记一笔或拍一张；将来：挂一道计划。
 */
function DayEmptyState({
  isToday,
  isFuture,
  onRecord,
  onPhoto,
}: {
  isToday: boolean;
  isFuture: boolean;
  onRecord: () => void;
  onPhoto: () => void;
}) {
  return (
    <View className="px-5">
      {/*
       * 空状态不是页面主内容，不该按整屏高度撑开：
       * minHeight 取一个紧凑但可呼应的值，把内容留在 Hero 下方不远处。
       */}
      <View className="items-center justify-center pt-6 pb-10" style={{ minHeight: 240 }}>
        <BowlMark size={72} />
        <Subhead className="mt-4 text-center">
          {isFuture ? '这天还没安排' : isToday ? '今天还没开张' : '这天吃了什么？'}
        </Subhead>
        <Caption className="mt-1.5 text-center" style={{ maxWidth: 250 }}>
          {isFuture
            ? '提前挂上想做的菜，到时不用现想吃什么。'
            : isToday
              ? '吃的时候顺手记一笔，一天就这样有了痕迹。'
              : '补一句也行，那天值得被记住。'}
        </Caption>
        {isFuture ? (
          <View className="mt-5">
            <Button onPress={onRecord}>安排一道</Button>
          </View>
        ) : (
          <View className="mt-5 flex-row" style={{ gap: 10 }}>
            <Button onPress={onRecord}>记一笔</Button>
            <Button variant="tonal" onPress={onPhoto}>
              拍一张
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}
