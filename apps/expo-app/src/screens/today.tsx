/**
 * 今日：周历条与日期选择器可浏览任意过去日期；历史记录可查看、补记与修改，
 * 未来日期禁用「记录」、改为「安排」。统计只看已实做的记录。
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { NavBar } from '@/chrome';
import { useCheckinSheet } from '@/chrome/checkin';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Ring, Sparkbars, Stat } from '@/components/data';
import { ActionRow, Badge, EmptyState, ListRow, Section, Skeleton } from '@/components/surfaces';
import { Body, Caption, Metric, Micro } from '@/components/text';
import { useCheckinRange, useCheckins, useRecipes, useStats } from '@/data/store';
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
import { useSession } from '@/session';
import { color } from '@/theme';

import { useTabScreenPadding } from './layout-metrics';

/** 周历条可往后看多远（天），给「安排下周吃什么」留出余地 */
const PLAN_HORIZON = 28;

export function TodayScreen() {
  const params = useLocalSearchParams<{
    day?: string;
    checkin?: string;
    meal?: string;
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
  /** 接下来一周的安排，只在看今天时当作预告展示 */
  const upcoming = useCheckinRange(shiftDay(today, 1), shiftDay(today, 7));

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
      meal: typeof params.meal === 'string' ? params.meal : undefined,
      recipe: typeof params.recipe === 'string' ? params.recipe : undefined,
    });
    router.setParams({ checkin: undefined, meal: undefined, recipe: undefined });
  }, [params.checkin, params.meal, params.recipe, router, sheet]);

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
    () => upcoming.checkins.filter((c) => c.planned).slice(0, 4),
    [upcoming.checkins]
  );

  const week = useMemo(() => weekOf(day), [day]);
  const weekCounts = useMemo(() => {
    const map = new Map(stats.days.map((d) => [d.day, d.count]));
    return week.map((d) => map.get(d) ?? 0);
  }, [stats.days, week]);
  const weekPlanned = useMemo(() => {
    const set = new Set(upcoming.checkins.filter((c) => c.planned).map((c) => c.day));
    return week.map((d) => set.has(d));
  }, [upcoming.checkins, week]);

  const last7 = useMemo(() => {
    const tail = stats.days.slice(-7);
    return {
      values: tail.map((d) => d.count),
      labels: tail.map((d) => WEEKDAYS[parseDay(d.day).getDay()]),
    };
  }, [stats.days]);

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

      {/* 概览：未来日期看的是安排，过去与今天看的是记录 */}
      <View className="px-5">
        <Section padded>
          <View className="flex-row items-center gap-5">
            <Ring
              pct={isFuture ? (planned.length > 0 ? 1 : 0) : done.length > 0 ? 1 : 0}
              size={96}
              stroke={8}
              tone={isFuture ? color.lake : color.accent}>
              <Metric size="text-[26px]">{String(isFuture ? planned.length : done.length)}</Metric>
              <Micro className="mt-0.5">
                {isFuture
                  ? planned.length > 0
                    ? '道安排'
                    : '未安排'
                  : done.length > 0
                    ? '次记录'
                    : '未记录'}
              </Micro>
            </Ring>
            <View className="min-w-0 flex-1">
              <Micro>{isFuture ? '用餐计划' : isToday ? '打卡记录' : '当日打卡'}</Micro>
              <View className="mt-1 flex-row items-baseline gap-1">
                <Metric>{String(stats.streak)}</Metric>
                <Caption>天连续记录</Caption>
              </View>
              <Caption className="mt-1.5 leading-relaxed">
                {loading
                  ? '加载中…'
                  : isFuture
                    ? planned.length > 0
                      ? `这天已经安排了 ${planned.length} 道，到时确认即可`
                      : '提前把菜挂到这天，买菜时就不用现想'
                    : isToday
                      ? done.length > 0
                        ? `今天已记 ${done.length} 次饮食，按需随心记录`
                        : '今天还没有记录，吃完随手记一笔'
                      : done.length > 0
                        ? `该日共记录了 ${done.length} 次饮食`
                        : '该日无记录，可点击下方补记'}
              </Caption>
            </View>
          </View>

          <View className="border-hair mt-5 border-t pt-4">
            <View className="mb-2 flex-row items-baseline justify-between">
              <Micro>近 7 天记录频次</Micro>
              <Caption tabular>{`${last7.values.reduce((s, v) => s + v, 0)} 次`}</Caption>
            </View>
            <Sparkbars
              values={last7.values}
              labels={last7.labels}
              tone={color.accent}
              height={36}
              highlightLast
            />
          </View>
        </Section>
      </View>

      {/* 当日安排：未确认的计划单独一组，一下就能转为记录 */}
      {planned.length > 0 ? (
        <View className="px-5">
          <Section
            title={isFuture ? '这天的安排' : '待确认的安排'}
            footer={
              isFuture
                ? '到那天在这里确认，才计入打卡与制作次数'
                : '轻点右侧对勾即确认吃过，点整行可修改'
            }>
            {planned.map((item) => (
              <ListRow
                key={item.id}
                label={`修改计划 ${item.title}`}
                leading={
                  <View className="h-[22px] w-[22px] items-center justify-center">
                    <Icon name="calendar-clock" size="md" tone="lake" />
                  </View>
                }
                title={item.title}
                subtitle={
                  [item.time, item.meal, item.portion, item.note].filter(Boolean).join(' · ') ||
                  undefined
                }
                trailing={
                  isFuture ? (
                    <Badge tone="lake">计划</Badge>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`确认吃了 ${item.title}`}
                      onPress={() => void sheet.confirmPlan(item)}
                      className="bg-lake-tint rounded-control h-8 flex-row items-center gap-1 px-2.5 active:opacity-70">
                      <Icon name="check" size="sm" tone="lake" strokeWidth={2.6} />
                      <Body tone="lake" size="text-[13px]" weight="font-semibold">
                        吃了
                      </Body>
                    </Pressable>
                  )
                }
                onPress={() => sheet.openCheckin({ day, existing: item })}
              />
            ))}
            <ActionRow
              icon={<Icon name="calendar-plus" size="md" tone="accent" strokeWidth={2.2} />}
              onPress={() => sheet.openCheckin({ day })}>
              再安排一道
            </ActionRow>
          </Section>
        </View>
      ) : null}

      {/* 饮食记录时间轴：未来日期不展示，那里只有安排 */}
      {isFuture ? (
        planned.length === 0 ? (
          <View className="px-5">
            <Section>
              <EmptyState
                icon={<Icon name="calendar-plus" size="xl" tone="accent" />}
                title="这天还没安排"
                description="提前挂上想做的菜，到时不用现想吃什么。"
                action={
                  <Button size="sm" onPress={() => sheet.openCheckin({ day })}>
                    安排一道
                  </Button>
                }
              />
            </Section>
          </View>
        ) : null
      ) : (
        <View className="px-5">
          <Section
            title={isToday ? '今日饮食' : '当日饮食'}
            footer="按用餐时间排序 · 轻点记录可修改或删除">
            {loading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <View key={i} className="flex-row items-center gap-3 px-4 py-3">
                    <Skeleton className="h-[22px] w-[22px]" rounded={11} />
                    <View className="flex-1" style={{ rowGap: 6 }}>
                      <Skeleton className="h-3.5 w-24" rounded={4} />
                      <Skeleton className="h-2.5 w-32" rounded={4} />
                    </View>
                  </View>
                ))}
              </>
            ) : done.length === 0 ? (
              <EmptyState
                icon={<Icon name="utensils-crossed" size="xl" tone="accent" />}
                title={isToday ? '今天还没记录饮食' : '这一天没有记录'}
                description="不用设定固定餐次，随吃随记。"
                action={
                  <Button size="sm" onPress={() => sheet.openCheckin({ day })}>
                    记一笔
                  </Button>
                }
              />
            ) : (
              <>
                {done.map((item) => (
                  <ListRow
                    key={item.id}
                    label={`修改 ${item.title}`}
                    leading={
                      item.photoId ? <PhotoThumb photoId={item.photoId} /> : <CheckCircleDone />
                    }
                    title={item.title}
                    subtitle={[item.time, item.meal, item.portion, item.note]
                      .filter(Boolean)
                      .join(' · ')}
                    accessory="chevron"
                    onPress={() => sheet.openCheckin({ day, existing: item })}
                  />
                ))}
                <ActionRow
                  icon={<Icon name="plus" size="md" tone="accent" strokeWidth={2.4} />}
                  onPress={() => sheet.openCheckin({ day })}>
                  记一笔饮食
                </ActionRow>
              </>
            )}
          </Section>
        </View>
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
                subtitle={`${monthDayLabel(item.day)} · 星期${WEEKDAYS[parseDay(item.day).getDay()]} · ${item.meal}`}
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

function CheckCircleDone() {
  return (
    <View className="bg-lake h-[22px] w-[22px] items-center justify-center rounded-full">
      <Icon name="check" size="sm" tone="invert" strokeWidth={3} />
    </View>
  );
}

function PhotoThumb({ photoId }: { photoId: number }) {
  return (
    <Image
      source={authedImageSource(apiUrl(`/api/photos/${photoId}`))}
      resizeMode="cover"
      accessibilityLabel="打卡照片"
      style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: '#EBEBF0' }}
    />
  );
}
