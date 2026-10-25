/**
 * 今日页的 Hero 大卡：上半是「今天吃了多少顿」的完成度环与连续记录，
 * 下半是周历条 2.0——迷你柱表示每天记了几笔，左右滑动换周，不再需要箭头与图例。
 * 视觉分量准则：环是页面锚点（120px），绿色只表达完成度，蓝色只留给交互。
 */
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

import { Ring } from '@/components/data';
import { Icon } from '@/components/icon';
import { Card } from '@/components/surfaces';
import { Body, Caption, Metric, Micro } from '@/components/text';
import type { Checkin } from '@/data/types';
import { mainMealsDone } from '@/domain/meal';
import { WEEKDAYS, parseDay, shiftDay } from '@/domain/date';
import { color } from '@/theme';

/** 早 / 午 / 晚——完成度环的分母 */
const MAIN_MEAL_GOAL = 3;

/** 换周手势的水平位移阈值；竖向位移交给页面滚动 */
const SWIPE_THRESHOLD = 40;

/** 迷你柱：0 笔是浅点，高度随次数阶梯上探（峰值给日期圆留出呼吸） */
function barHeight(count: number) {
  if (count <= 0) return 5;
  if (count === 1) return 11;
  if (count === 2) return 16;
  return 22;
}

export function TodayHero({
  day,
  today,
  maxDay,
  streak,
  monthActiveDays,
  done,
  planned,
  week,
  weekCounts,
  weekPlanned,
  onSelect,
}: {
  day: string;
  today: string;
  maxDay: string;
  streak: number;
  monthActiveDays: number;
  done: Checkin[];
  planned: Checkin[];
  week: string[];
  weekCounts: number[];
  weekPlanned: boolean[];
  onSelect: (day: string) => void;
}) {
  const isToday = day === today;
  const isFuture = day > today;
  const meals = mainMealsDone(done.map((c) => c.time));
  const monthLabel = `${parseDay(week[0]).getMonth() + 1} 月`;
  const weekRange = `${parseDay(week[0]).getDate()}–${parseDay(week[6]).getDate()} 日`;

  /* 左右滑动换周：位移不足或越界就当没发生 */
  const swipe = Gesture.Pan()
    .activeOffsetX([-16, 16])
    .failOffsetY([-10, 10])
    .onEnd((event) => {
      if (event.translationX <= -SWIPE_THRESHOLD) {
        const next = shiftDay(day, 7);
        if (next <= maxDay) onSelect(next);
      } else if (event.translationX >= SWIPE_THRESHOLD) {
        onSelect(shiftDay(day, -7));
      }
    });

  return (
    <View className="px-5">
      <Card padded={false}>
        {/* 完成度环 + 连续记录：环是锚点，右侧降为次级信息区 */}
        <View
          className="flex-row items-center"
          style={{ paddingHorizontal: 20, paddingVertical: 18, gap: 20 }}>
          <Ring
            pct={meals / MAIN_MEAL_GOAL}
            size={118}
            stroke={13}
            tone={color.lake}
            track={color.hair}>
            <Metric size="text-[32px]">{String(meals)}</Metric>
            <Micro tone="muted" className="mt-0.5">
              {isFuture ? '道安排' : `/${MAIN_MEAL_GOAL} 餐`}
            </Micro>
          </Ring>

          {isToday ? (
            <View className="min-w-0 flex-1" style={{ rowGap: 9 }}>
              <View className="flex-row items-center gap-1.5">
                <Icon name="calendar-check" size="md" tone="lake" />
                <Body tone="soft">连续记录</Body>
              </View>
              <View className="flex-row items-baseline">
                <Metric size="text-[30px]">{String(streak)}</Metric>
                <Body tone="soft" className="ml-1">
                  天
                </Body>
              </View>
              <Caption tone="muted">本月 {monthActiveDays} 天有记录</Caption>
            </View>
          ) : (
            <View className="min-w-0 flex-1" style={{ rowGap: 9 }}>
              <View className="flex-row items-center gap-1.5">
                <Icon name={isFuture ? 'calendar-clock' : 'notebook-pen'} size="md" tone="soft" />
                <Body tone="soft">{isFuture ? '待赴安排' : '当天记录'}</Body>
              </View>
              <View className="flex-row items-baseline">
                <Metric size="text-[30px]">{String(done.length)}</Metric>
                <Body tone="soft" className="ml-1">
                  {isFuture ? '道' : '条'}
                </Body>
              </View>
              <Caption tone="muted">
                {planned.length > 0
                  ? `${planned.length} 道安排待赴`
                  : isFuture
                    ? '提前挂上想做的菜'
                    : '这天没有留下记录'}
              </Caption>
            </View>
          )}
        </View>

        {/* 周历条：迷你柱 + 滑动换周 */}
        <View className="border-hair/70 border-t" style={{ paddingTop: 18, paddingBottom: 16 }}>
          <View className="mb-2 flex-row items-baseline justify-between px-5">
            <Micro>{monthLabel}</Micro>
            <Micro tone="muted">{weekRange}</Micro>
          </View>

          <GestureDetector gesture={swipe}>
            <Animated.View
              key={week[0]}
              entering={FadeIn.duration(240)}
              className="flex-row px-1.5">
              {week.map((d, i) => {
                const date = parseDay(d);
                const selected = d === day;
                const beyond = d > maxDay;
                const future = d > today;
                const count = weekCounts[i] ?? 0;
                const hasPlan = weekPlanned[i] ?? false;
                const isTodayCell = d === today;
                return (
                  <Pressable
                    key={d}
                    accessibilityRole="button"
                    accessibilityLabel={
                      future ? `${d}，${hasPlan ? '已有安排' : '可安排'}` : `${d}，${count} 条记录`
                    }
                    accessibilityState={{ disabled: beyond, selected }}
                    disabled={beyond}
                    onPress={() => onSelect(d)}
                    className={`flex-1 items-center ${beyond ? 'opacity-25' : ''}`}
                    style={{ rowGap: 6 }}>
                    <Body tone="muted" size="text-[11px]" weight="font-normal">
                      {WEEKDAYS[date.getDay()]}
                    </Body>
                    <View
                      className="h-[38px] w-[38px] items-center justify-center"
                      style={
                        selected
                          ? { backgroundColor: color.accent, borderRadius: 19 }
                          : isTodayCell
                            ? { borderWidth: 1.5, borderColor: color.accent, borderRadius: 19 }
                            : { borderRadius: 19 }
                      }>
                      <Body
                        tabular
                        size="text-[17px]"
                        weight={selected || isTodayCell ? 'font-semibold' : 'font-medium'}
                        tone={selected ? 'invert' : future ? 'muted' : 'ink'}>
                        {String(date.getDate())}
                      </Body>
                    </View>

                    {/* 迷你柱：过去与今天表示记录数，未来表示是否有安排 */}
                    <View className="h-[26px] w-4 items-center justify-end">
                      {future ? (
                        hasPlan ? (
                          <View
                            className="rounded-full"
                            style={{
                              width: 8,
                              height: 8,
                              borderWidth: 2,
                              borderColor: color.lake,
                            }}
                          />
                        ) : (
                          <View
                            className="rounded-full"
                            style={{ width: 5, height: 5, backgroundColor: color.fillDeep }}
                          />
                        )
                      ) : (
                        <View
                          className="rounded-full"
                          style={{
                            width: selected ? 8 : 6,
                            height: barHeight(count),
                            backgroundColor: count > 0 ? color.lake : color.fillDeep,
                          }}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </Animated.View>
          </GestureDetector>
        </View>
      </Card>
    </View>
  );
}
