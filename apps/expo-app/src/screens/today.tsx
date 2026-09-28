/**
 * 今日：周历条与日期选择器可浏览任意过去日期；历史记录可查看、补记与修改，
 * 未来日期禁用「记录」、改为「安排」。统计只看已实做的记录。
 *
 * 同一天不再分餐次：记录与未确认的安排合成一条时间轴，按时间排开；
 * 两条间隔超过 TL_CLUSTER_MIN 分钟才画分隔线，挨得近的自然抱成一团。
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { NavBar } from '@/chrome';
import { useCheckinSheet } from '@/chrome/checkin';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Stat } from '@/components/data';
import {
  Badge,
  Card,
  ListRow,
  Section,
  SectionHeader,
  Skeleton,
  TrailingChevron,
} from '@/components/surfaces';
import { Body, Caption, Micro, Subhead } from '@/components/text';
import { useCheckinRange, useCheckins, useRecipes, useStats } from '@/data/store';
import type { Checkin } from '@/data/types';
import { apiUrl, authedImageSource } from '@/data/client';
import {
  WEEKDAYS,
  monthDayLabel,
  parseDay,
  relativeDayLabel,
  shiftDay,
  todayISO,
  weekOf,
} from '@/domain/date';
import { layoutTransition, usePressFeedback } from '@/motion';
import { useSession } from '@/session';
import { alpha, color, hairline, radius } from '@/theme';

import { useTabScreenPadding } from './layout-metrics';

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
  const { stats } = useStats();
  const { recipes } = useRecipes();
  const { user } = useSession();
  /**
   * 整个可安排区间（今天到 PLAN_HORIZON）的安排。
   * 拉满区间是因为周历上的「已安排」圆点要覆盖所有能排的日子；
   * 「接下来的安排」列表再按未来七天截取。
   */
  const plannedRange = useCheckinRange(shiftDay(today, 1), maxDay);

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
  const checkins = history.checkins;
  const loading = history.loading;

  /** 已实做与计划两组分开 */
  const done = useMemo(
    () => checkins.filter((c) => !c.planned).sort((a, b) => a.time.localeCompare(b.time)),
    [checkins]
  );
  const planned = useMemo(
    () => checkins.filter((c) => c.planned).sort((a, b) => a.time.localeCompare(b.time)),
    [checkins]
  );
  const upcomingPlans = useMemo(
    () =>
      plannedRange.checkins
        .filter((c) => c.planned && c.day <= shiftDay(today, 7))
        .sort((a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time))
        .slice(0, 4),
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
  const nowMinutes = clock.minutes;

  const hasEntries = done.length > 0 || planned.length > 0;
  const showSkeleton = loading && !hasEntries;

  /** 记录与安排合成一条时间轴，今天再插入「现在」 */
  const nodes = useMemo<TimelineNode[]>(() => {
    const entries = [...done, ...planned].sort(
      (a, b) => a.time.localeCompare(b.time) || Number(a.planned) - Number(b.planned)
    );
    const out: TimelineNode[] = [];
    const now = minutesToTime(nowMinutes);
    let placed = false;
    let prev: Checkin | null = null;
    for (const item of entries) {
      if (isToday && !placed && item.time > now) {
        out.push({ kind: 'now' });
        placed = true;
      }
      out.push({
        kind: 'entry',
        item,
        separator: prev !== null && toMinutes(item.time) - toMinutes(prev.time) >= TL_CLUSTER_MIN,
      });
      prev = item;
    }
    if (isToday && !placed && entries.length > 0) out.push({ kind: 'now' });
    return out;
  }, [done, planned, isToday, nowMinutes]);

  const headLabel = isFuture ? '这天' : isToday ? '今日' : '当日';
  const headSummary = isFuture
    ? planned.length > 0
      ? `${planned.length} 道安排`
      : '还没有安排'
    : done.length > 0
      ? `${done.length} 条记录 · ${done[0].time} – ${done[done.length - 1].time}`
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

  const monthLabel = `${parseDay(week[0]).getMonth() + 1} 月`;
  const dateLabel = isToday
    ? `${parseDay(day).getMonth() + 1} 月 ${parseDay(day).getDate()} 日 · 星期${WEEKDAYS[parseDay(day).getDay()]}`
    : `${parseDay(day).getFullYear()} 年 ${parseDay(day).getMonth() + 1} 月 ${parseDay(day).getDate()} 日${
        isFuture ? ' · 将来' : ''
      }`;

  return (
    <ScrollView
      className="bg-paper"
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop, paddingBottom, rowGap: 24 }}
      showsVerticalScrollIndicator={false}>
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

      {/* 日期浏览：始终可见，未来禁用，选中态为蓝色实心 */}
      <View className="px-5">
        <Section padded>
          <View className="mb-2 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="上一周"
              onPress={() => select(shiftDay(day, -7))}
              hitSlop={8}
              className="-ml-2 h-8 w-8 items-center justify-center rounded-full">
              <Icon name="chevron-left" size="md" tone="accent" />
            </Pressable>
            <Micro>{monthLabel}</Micro>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="下一周"
              accessibilityState={{ disabled: shiftDay(day, 7) > maxDay }}
              disabled={shiftDay(day, 7) > maxDay}
              onPress={() => select(shiftDay(day, 7))}
              hitSlop={8}
              className="-mr-2 h-8 w-8 items-center justify-center rounded-full">
              <Icon
                name="chevron-right"
                size="md"
                tone={shiftDay(day, 7) > maxDay ? 'muted' : 'accent'}
              />
            </Pressable>
          </View>

          <View className="flex-row">
            {week.map((d, i) => {
              const date = parseDay(d);
              const selected = d === day;
              const beyond = d > maxDay;
              const future = d > today;
              const count = weekCounts[i] ?? 0;
              const hasPlan = weekPlanned[i] ?? false;
              const dot =
                d === today && !selected
                  ? color.accent
                  : future
                    ? hasPlan
                      ? color.lake
                      : 'transparent'
                    : count > 0
                      ? color.lake
                      : 'transparent';
              return (
                <Pressable
                  key={d}
                  accessibilityRole="button"
                  accessibilityLabel={
                    future ? `${d}，${hasPlan ? '已有安排' : '可安排'}` : `${d}，${count} 条记录`
                  }
                  accessibilityState={{ disabled: beyond, selected }}
                  disabled={beyond}
                  onPress={() => select(d)}
                  className={`flex-1 items-center gap-1 py-1 ${beyond ? 'opacity-25' : ''}`}>
                  <Body tone="muted" size="text-[11px]" weight="font-normal">
                    {WEEKDAYS[date.getDay()]}
                  </Body>
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={selected ? { backgroundColor: color.accent } : undefined}>
                    <Body
                      tabular
                      size="text-[16px]"
                      weight="font-semibold"
                      tone={selected ? 'invert' : future ? 'muted' : 'ink'}>
                      {String(date.getDate())}
                    </Body>
                  </View>
                  <View className="h-1 w-1 rounded-full" style={{ backgroundColor: dot }} />
                </Pressable>
              );
            })}
          </View>

          <View className="border-hair mt-2 flex-row items-center justify-center gap-4 border-t pt-2.5">
            <Legend color={color.lake} text="有记录 / 已安排" />
            <Legend color={color.accent} text="今天" />
          </View>
        </Section>
      </View>

      {/* 时间轴：记录与未确认的安排共用一条轨道，按时间排开 */}
      {hasEntries || showSkeleton ? (
        <View className="px-5">
          <SectionHeader
            label={headLabel}
            trailing={showSkeleton ? null : <Caption tabular>{headSummary}</Caption>}
          />
          <Card padded={false}>
            <View style={{ paddingTop: 4, paddingBottom: 5 }}>
              {showSkeleton ? (
                <TimelineSkeleton />
              ) : (
                nodes.map((node, i) => {
                  const line = railLine(i, nodes.length);
                  if (node.kind === 'now') return <NowRow key="now" line={line} />;
                  return (
                    <TimelineRow
                      key={node.item.id}
                      item={node.item}
                      line={line}
                      separator={node.separator}
                      trailing={
                        node.item.planned ? (
                          isFuture ? (
                            <Badge tone="lake">计划</Badge>
                          ) : (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`确认吃了 ${node.item.title}`}
                              onPress={() => void sheet.confirmPlan(node.item)}
                              className="bg-lake-tint rounded-control h-8 flex-row items-center gap-1 px-2.5 active:opacity-70">
                              <Icon name="check" size="sm" tone="lake" strokeWidth={2.6} />
                              <Body tone="lake" size="text-[13px]" weight="font-semibold">
                                吃了
                              </Body>
                            </Pressable>
                          )
                        ) : (
                          <TrailingChevron />
                        )
                      }
                      onPress={() => sheet.openCheckin({ day, existing: node.item })}
                    />
                  );
                })
              )}
            </View>
          </Card>
          <Caption className="mt-2 px-1">
            {isFuture
              ? '到那天在这里确认，才计入打卡与制作次数'
              : '按用餐时间排序 · 轻点记录可修改或删除'}
          </Caption>
        </View>
      ) : (
        /* 空状态：不摆卡片、也不进时间轴，把「现在」的位置让给一句邀请 */
        <DayEmptyState
          isToday={isToday}
          isFuture={isFuture}
          onPress={() => sheet.openCheckin({ day })}
        />
      )}

      {/* 看今天时预告未来一周的安排，点进去就是那天 */}
      {isToday && upcomingPlans.length > 0 ? (
        <View className="px-5">
          <Section title="接下来的安排" footer="未来七天 · 点击查看那天">
            {upcomingPlans.map((item) => (
              <ListRow
                key={item.id}
                leading={
                  <View className="h-[22px] w-[22px] items-center justify-center">
                    <Icon name="calendar-clock" size="md" tone="lake" />
                  </View>
                }
                title={item.title}
                subtitle={`${monthDayLabel(item.day)} · 星期${WEEKDAYS[parseDay(item.day).getDay()]}`}
                accessory="chevron"
                onPress={() => select(item.day)}
              />
            ))}
          </Section>
        </View>
      ) : null}

      {/* 常做菜谱：次数与「上次做于」已经是真数据，由打卡派生 */}
      {recipes.length > 0 ? (
        <View className="px-5">
          <Section title="常做菜谱" footer="按制作次数排序，点击查看详情">
            {[...recipes]
              .sort((a, b) => b.cooked - a.cooked)
              .slice(0, 3)
              .map((recipe) => (
                <ListRow
                  key={recipe.slug}
                  leading={
                    <View className="bg-tint rounded-thumb h-10 w-10 items-center justify-center">
                      <Icon name="clock" size="md" tone="accent" />
                    </View>
                  }
                  title={recipe.title}
                  subtitle={`${recipe.category} · ${relativeDayLabel(recipe.lastCookedOn)} · 累计 ${recipe.cooked} 次`}
                  accessory="chevron"
                  onPress={() => router.push(`/recipes/${recipe.slug}`)}
                />
              ))}
          </Section>
        </View>
      ) : null}

      <View className="flex-row gap-3 px-5">
        <View className="flex-1">
          <Section padded>
            <Stat value={stats.totals.activeDays} label="本月打卡天" tone="accent" />
          </Section>
        </View>
        <View className="flex-1">
          <Section padded>
            <Stat value={stats.totals.checkins} label="累计记录" />
          </Section>
        </View>
        <View className="flex-1">
          <Section padded>
            <Stat value={stats.totals.planned} label="待赴的安排" tone="lake" />
          </Section>
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * 一天没有任何内容时的兜底。
 * 过去 / 今天：邀请写一句；将来：邀请挂一道计划。
 * 两者只是图标与文案不同，骨架共用——同一屏不该出现两套空态语言。
 */
function DayEmptyState({
  isToday,
  isFuture,
  onPress,
}: {
  isToday: boolean;
  isFuture: boolean;
  onPress: () => void;
}) {
  return (
    <View className="px-5">
      <View className="items-center justify-center" style={{ minHeight: 360, paddingBottom: 40 }}>
        <View className="bg-fill-deep h-14 w-14 items-center justify-center rounded-full">
          <Icon name={isFuture ? 'calendar-plus' : 'notebook-pen'} size="xl" tone="soft" />
        </View>
        <Subhead className="mt-4 text-center">
          {isFuture ? '这天还没安排' : isToday ? '今天吃了什么？' : '这天吃了什么？'}
        </Subhead>
        <Caption className="mt-1.5 text-center" style={{ maxWidth: 250 }}>
          {isFuture ? '提前挂上想做的菜，到时不用现想吃什么。' : '写一句，或者直接拍张照。'}
        </Caption>
        <View className="mt-5">
          <Button onPress={onPress}>{isFuture ? '安排一道' : '记一笔'}</Button>
        </View>
      </View>
    </View>
  );
}

function Legend({ color: tone, text }: { color: string; text: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
      <Body tone="muted" size="text-[11px]" weight="font-normal">
        {text}
      </Body>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 时间轴                                                               */
/* ------------------------------------------------------------------ */

/** 时间列宽：整列右对齐（贴着轨道），13pt 的 HH:MM 直接用它，不必再扣内边距 */
const TL_GUTTER = 52;
/** 轨道列宽 */
const TL_RAIL = 20;
/** 分隔线与内容的起始位置 */
const TL_INSET = TL_GUTTER + TL_RAIL;
/** 行内容上下内边距 */
const TL_PAD_Y = 12;
/** 标题行（15/22）的中线：时间、圆点都对齐到这里，而不是整行居中 */
const TL_DOT_Y = TL_PAD_Y + 11;
/** 「现在」行的高度与中线 */
const TL_NOW_H = 38;
const TL_NOW_Y = TL_NOW_H / 2;
/** 间隔超过这个分钟数才画分隔线：挨得近的自然抱团，不必再分餐次 */
const TL_CLUSTER_MIN = 120;

type TimelineNode = { kind: 'entry'; item: Checkin; separator: boolean } | { kind: 'now' };

function toMinutes(time: string) {
  const [h, m] = time.split(':');
  return Number(h) * 60 + Number(m);
}

function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 轨道竖线在本行的画法：首行不向上伸、末行不向下伸 */
function railLine(index: number, total: number) {
  if (total <= 1) return 'none' as const;
  if (index === 0) return 'start' as const;
  if (index === total - 1) return 'end' as const;
  return 'mid' as const;
}

function Rail({ line, dot }: { line: ReturnType<typeof railLine>; dot: 'done' | 'plan' | 'now' }) {
  const center = dot === 'now' ? TL_NOW_Y : TL_DOT_Y;
  const size = dot === 'now' ? 10 : 9;
  /** 白圈把竖线干净地断在圆点两侧 */
  const ring = dot === 'now' ? 16 : 15;
  const halo = dot === 'now' ? 23 : 0;
  const mid = TL_RAIL / 2;

  return (
    <View className="relative self-stretch" style={{ width: TL_RAIL }}>
      {line === 'none' ? null : (
        <View
          className="bg-paper-deep absolute"
          style={[
            { left: mid - 1, width: 2 },
            line === 'start'
              ? { top: center, bottom: 0 }
              : line === 'end'
                ? { top: 0, height: center }
                : { top: 0, bottom: 0 },
          ]}
        />
      )}
      {halo > 0 ? (
        <View
          className="absolute rounded-full"
          style={{
            left: mid - halo / 2,
            top: center - halo / 2,
            width: halo,
            height: halo,
            backgroundColor: alpha.accent28,
          }}
        />
      ) : null}
      <View
        className="bg-card absolute rounded-full"
        style={{ left: mid - ring / 2, top: center - ring / 2, width: ring, height: ring }}
      />
      <View
        className="absolute rounded-full"
        style={{
          left: mid - size / 2,
          top: center - size / 2,
          width: size,
          height: size,
          backgroundColor: dot === 'done' ? color.lake : dot === 'now' ? color.accent : color.card,
          borderWidth: dot === 'plan' ? 1.5 : 0,
          borderColor: color.fillDeep,
        }}
      />
    </View>
  );
}

function TimelineRow({
  item,
  trailing,
  separator,
  line,
  onPress,
}: {
  item: Checkin;
  trailing: ReactNode;
  separator: boolean;
  line: ReturnType<typeof railLine>;
  onPress: () => void;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback(0.995);

  return (
    <Animated.View style={animatedStyle} layout={layoutTransition}>
      <Pressable
        className="active:bg-tint/70 w-full"
        accessibilityRole="button"
        accessibilityLabel={item.planned ? `修改计划 ${item.title}` : `修改 ${item.title}`}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
        <View className="relative flex-row items-start">
          {separator ? (
            <View
              className="bg-hair absolute"
              style={{ left: TL_INSET, right: 16, top: 0, height: hairline }}
            />
          ) : null}

          <View
            className="shrink-0 items-end"
            style={{ width: TL_GUTTER, paddingTop: TL_DOT_Y - 9.5 }}>
            <Caption tabular numberOfLines={1}>
              {item.time}
            </Caption>
          </View>

          <Rail line={line} dot={item.planned ? 'plan' : 'done'} />

          <View
            className="min-w-0 flex-1"
            style={{ paddingTop: TL_PAD_Y, paddingBottom: TL_PAD_Y, paddingRight: 16 }}>
            <View className="flex-row items-center gap-2.5">
              <View className="min-w-0 flex-1">
                <Body numberOfLines={1} tone={item.planned ? 'soft' : 'ink'}>
                  {item.title}
                </Body>
                {item.note ? (
                  <Caption numberOfLines={1} className="mt-0.5">
                    {item.note}
                  </Caption>
                ) : null}
                {item.photoId ? (
                  <Image
                    source={authedImageSource(apiUrl(`/api/photos/${item.photoId}`))}
                    resizeMode="cover"
                    accessibilityLabel="打卡照片"
                    style={{
                      marginTop: 10,
                      alignSelf: 'stretch',
                      height: 152,
                      borderRadius: radius.thumb,
                      backgroundColor: color.fill,
                    }}
                  />
                ) : null}
              </View>
              {trailing}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function NowRow({ line }: { line: ReturnType<typeof railLine> }) {
  return (
    <View className="flex-row items-start" style={{ height: TL_NOW_H }}>
      <View className="shrink-0 items-end" style={{ width: TL_GUTTER, paddingTop: TL_NOW_Y - 7 }}>
        <Body tone="accent" size="text-micro" weight="font-semibold" numberOfLines={1}>
          现在
        </Body>
      </View>
      <Rail line={line} dot="now" />
      <View className="flex-1" />
    </View>
  );
}

function TimelineSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <View key={i} className="flex-row items-start">
          <View
            className="shrink-0 items-end"
            style={{ width: TL_GUTTER, paddingTop: TL_DOT_Y - 6 }}>
            <Skeleton className="h-3 w-9" rounded={4} />
          </View>
          <View style={{ width: TL_RAIL }} />
          <View
            className="flex-1"
            style={{ paddingTop: TL_PAD_Y, paddingBottom: TL_PAD_Y, paddingRight: 16 }}>
            <Skeleton className="h-3.5 w-28" rounded={4} />
            <Skeleton className="mt-2 h-2.5 w-40" rounded={4} />
          </View>
        </View>
      ))}
    </>
  );
}
