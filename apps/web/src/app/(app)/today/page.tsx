"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  UtensilsCrossed,
} from "lucide-react";
import {
  ActionRow,
  Badge,
  Button,
  Caption,
  CheckCircle,
  EmptyState,
  ListRow,
  Metric,
  Micro,
  NavBar,
  Ring,
  Section,
  Skeleton,
  Sparkbars,
  Stat,
} from "@/components/ds";
import { color, layout } from "@/design/tokens";
import { useCheckinSheet } from "@/components/app/CheckinProvider";
import { useSession } from "@/components/app/SessionProvider";
import { todayISO, relativeDayLabel } from "@/lib/content";
import { useCheckinRange, useCheckins, useRecipes, useStats } from "@/lib/use-app-data";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
/** 周历条可往后看多远（天），给“安排下周吃什么”留出余地 */
const PLAN_HORIZON = 28;

const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const parse = (day: string) => new Date(`${day}T12:00:00`);
const shift = (day: string, n: number) => {
  const d = parse(day);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export default function TodayPage() {
  const router = useRouter();
  const sheet = useCheckinSheet();
  const { user } = useSession();
  const today = todayISO();
  const [day, setDay] = useState(today);
  const historical = useCheckins(day);
  const { stats } = useStats();
  const { recipes } = useRecipes();
  /** 接下来一周的安排，只在看今天时当作预告展示 */
  const upcoming = useCheckinRange(shift(today, 1), shift(today, 7));

  const maxDay = shift(today, PLAN_HORIZON);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const requested = new URLSearchParams(window.location.search).get("day");
      if (requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested <= maxDay) {
        setDay(requested);
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [maxDay]);

  const isToday = day === today;
  const isFuture = day > today;
  const checkins = isToday ? sheet.checkins : historical.checkins;
  const loading = isToday ? sheet.loading : historical.loading;

  /** 已实做与计划两组分开，统计只看已实做 */
  const done = useMemo(
    () =>
      checkins
        .filter((c) => !c.planned)
        .sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [checkins],
  );
  const planned = useMemo(
    () =>
      checkins
        .filter((c) => c.planned)
        .sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [checkins],
  );

  const upcomingPlans = useMemo(
    () => upcoming.checkins.filter((c) => c.planned).slice(0, 4),
    [upcoming.checkins],
  );

  /** 周历条：以选中日所在周（周一起）为窗口 */
  const week = useMemo(() => {
    const selected = parse(day);
    const monday = new Date(selected);
    monday.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return iso(d);
    });
  }, [day]);

  const weekCounts = useMemo(() => {
    const map = new Map(stats.days.map((d) => [d.day, d.count]));
    return week.map((d) => map.get(d) ?? 0);
  }, [stats.days, week]);

  /** 周历条上未来哪几天有安排，用绿点提示 */
  const weekPlanned = useMemo(() => {
    const set = new Set(upcoming.checkins.filter((c) => c.planned).map((c) => c.day));
    return week.map((d) => set.has(d));
  }, [upcoming.checkins, week]);

  const last7 = useMemo(() => {
    const tail = stats.days.slice(-7);
    return {
      values: tail.map((d) => d.count),
      labels: tail.map((d) => WEEKDAYS[parse(d.day).getDay()]),
    };
  }, [stats.days]);

  const select = (next: string) => {
    if (next > maxDay) return;
    setDay(next);
    router.replace(next === today ? "/today" : `/today?day=${next}`, { scroll: false });
  };

  const monthLabel = `${parse(week[0]).getMonth() + 1} 月`;
  const dateLabel = isToday
    ? `${parse(day).getMonth() + 1} 月 ${parse(day).getDate()} 日 · 星期${WEEKDAYS[parse(day).getDay()]}`
    : `${parse(day).getFullYear()} 年 ${parse(day).getMonth() + 1} 月 ${parse(day).getDate()} 日${
        isFuture ? " · 将来" : ""
      }`;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <NavBar
        variant="large"
        largeTitle={isToday ? "今天" : `${parse(day).getMonth() + 1}月${parse(day).getDate()}日`}
        subtitle={dateLabel}
        trailing={
          isToday ? (
            <button
              type="button"
              onClick={() => router.push("/profile")}
              aria-label="我的"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-fill text-[14px] font-semibold text-indigo active:bg-fill-deep"
            >
              {user.name.slice(0, 1)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => select(today)}
              className="px-2 py-1 text-[15px] font-medium text-indigo active:opacity-50"
            >
              今天
            </button>
          )
        }
      />

      {/* 日期浏览：始终可见，未来禁用，选中态为蓝色实心 */}
      <div className="px-5">
        <Section padded>
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => select(shift(day, -7))}
              aria-label="上一周"
              className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full text-indigo active:bg-fill"
            >
              <ChevronLeft size={18} />
            </button>
            <Micro>{monthLabel}</Micro>
            <button
              type="button"
              onClick={() => select(shift(day, 7))}
              disabled={shift(day, 7) > maxDay}
              aria-label="下一周"
              className="-mr-2 flex h-8 w-8 items-center justify-center rounded-full text-indigo active:bg-fill disabled:text-muted/30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7">
            {week.map((d, i) => {
              const date = parse(d);
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
                      : "transparent"
                    : count > 0
                      ? color.lake
                      : "transparent";
              return (
                <button
                  key={d}
                  type="button"
                  disabled={beyond}
                  onClick={() => select(d)}
                  aria-current={selected ? "date" : undefined}
                  aria-label={
                    future
                      ? `${d}，${hasPlan ? "已有安排" : "可安排"}`
                      : `${d}，${count} 条记录`
                  }
                  className="flex flex-col items-center gap-1 py-1 disabled:opacity-25"
                >
                  <span className="text-[11px] text-muted">{WEEKDAYS[date.getDay()]}</span>
                  <span
                    className={`u-num flex h-9 w-9 items-center justify-center rounded-full text-[16px] font-semibold transition-colors ${
                      selected
                        ? "bg-indigo text-white"
                        : future
                          ? "text-muted active:bg-fill"
                          : "text-ink active:bg-fill"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: dot }}
                  />
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 border-t border-hair pt-2.5">
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: color.lake }} />
              有记录 / 已安排
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: color.accent }} />
              今天
            </span>
          </div>
        </Section>
      </div>

      {/* 概览：未来日期看的是安排，过去与今天看的是记录 */}
      <div className="px-5">
        <Section padded>
          <div className="flex items-center gap-5">
            <Ring
              pct={isFuture ? (planned.length > 0 ? 1 : 0) : done.length > 0 ? 1 : 0}
              size={96}
              stroke={8}
              tone={isFuture ? color.lake : color.accent}
            >
              <Metric className="text-[26px]">
                {isFuture ? planned.length : done.length}
              </Metric>
              <Micro className="mt-0.5">
                {isFuture
                  ? planned.length > 0
                    ? "道安排"
                    : "未安排"
                  : done.length > 0
                    ? "次记录"
                    : "未记录"}
              </Micro>
            </Ring>
            <div className="min-w-0 flex-1">
              <Micro>{isFuture ? "用餐计划" : isToday ? "打卡记录" : "当日打卡"}</Micro>
              <div className="mt-1 flex items-baseline gap-1">
                <Metric>{stats.streak}</Metric>
                <Caption>天连续记录</Caption>
              </div>
              <Caption className="mt-1.5 block leading-relaxed">
                {loading
                  ? "加载中…"
                  : isFuture
                    ? planned.length > 0
                      ? `这天已经安排了 ${planned.length} 道，到时确认即可`
                      : "提前把菜挂到这天，买菜时就不用现想"
                    : isToday
                      ? done.length > 0
                        ? `今天已记 ${done.length} 次饮食，按需随心记录`
                        : "今天还没有记录，吃完随手记一笔"
                      : done.length > 0
                        ? `该日共记录了 ${done.length} 次饮食`
                        : "该日无记录，可点击下方补记"}
              </Caption>
            </div>
          </div>
          <div className="mt-5 border-t border-hair pt-4">
            <div className="mb-2 flex items-baseline justify-between">
              <Micro>近 7 天记录频次</Micro>
              <Caption className="u-num tabular-nums">
                {last7.values.reduce((s, v) => s + v, 0)} 次
              </Caption>
            </div>
            <Sparkbars
              values={last7.values}
              labels={last7.labels}
              tone={color.accent}
              height={36}
              highlightLast
            />
          </div>
        </Section>
      </div>

      {/* 当日安排：未确认的计划单独一组，一下就能转为记录 */}
      {planned.length > 0 ? (
        <div className="px-5">
          <Section
            title={isFuture ? "这天的安排" : "待确认的安排"}
            footer={
              isFuture
                ? "到那天在这里确认，才计入打卡与制作次数"
                : "轻点右侧对勾即确认吃过，点整行可修改"
            }
          >
            {planned.map((item) => (
              <ListRow
                key={item.id}
                ariaLabel={`修改计划 ${item.title}`}
                leading={
                  <span className="flex h-[22px] w-[22px] items-center justify-center text-lake-deep">
                    <CalendarClock size={17} />
                  </span>
                }
                title={item.title}
                subtitle={
                  [item.time, item.meal, item.portion, item.note]
                    .filter(Boolean)
                    .join(" · ") || undefined
                }
                trailing={
                  isFuture ? (
                    <Badge tone="lake">计划</Badge>
                  ) : (
                    <button
                      type="button"
                      aria-label={`确认吃了 ${item.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        void sheet.confirmPlan(item);
                      }}
                      className="flex h-8 items-center gap-1 rounded-control bg-lake-tint px-2.5 text-[13px] font-semibold text-lake-deep active:opacity-70"
                    >
                      <Check size={14} strokeWidth={2.6} />
                      吃了
                    </button>
                  )
                }
                onClick={() => sheet.openCheckin({ day, existing: item })}
              />
            ))}
            <ActionRow
              icon={<CalendarPlus size={16} strokeWidth={2.2} />}
              onClick={() => sheet.openCheckin({ day })}
            >
              再安排一道
            </ActionRow>
          </Section>
        </div>
      ) : null}

      {/* 饮食记录时间轴：未来日期不展示，那里只有安排 */}
      {isFuture ? (
        planned.length === 0 ? (
          <div className="px-5">
            <Section>
              <EmptyState
                icon={<CalendarPlus size={26} strokeWidth={1.6} />}
                title="这天还没安排"
                description="提前挂上想做的菜，到时不用现想吃什么。"
                action={
                  <Button size="sm" onClick={() => sheet.openCheckin({ day })}>
                    安排一道
                  </Button>
                }
              />
            </Section>
          </div>
        ) : null
      ) : (
        <div className="px-5">
          <Section
            title={isToday ? "今日饮食" : "当日饮食"}
            footer="按用餐时间排序 · 轻点记录可修改或删除"
          >
            {loading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="u-sep flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-[22px] w-[22px]" rounded="rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-2.5 w-32" />
                    </div>
                  </div>
                ))}
              </>
            ) : done.length === 0 ? (
              <EmptyState
                icon={<UtensilsCrossed size={26} strokeWidth={1.6} />}
                title={isToday ? "今天还没记录饮食" : "这一天没有记录"}
                description="不用设定固定餐次，随吃随记。"
                action={
                  <Button size="sm" onClick={() => sheet.openCheckin({ day })}>
                    记一笔
                  </Button>
                }
              />
            ) : (
              <>
                {done.map((item) => (
                  <ListRow
                    key={item.id}
                    ariaLabel={`修改 ${item.title}`}
                    leading={
                      item.photoId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/photos/${item.photoId}`}
                          alt=""
                          className="h-10 w-10 rounded-thumb bg-fill object-cover"
                        />
                      ) : (
                        <CheckCircle done />
                      )
                    }
                    title={item.title}
                    subtitle={
                      [item.time, item.meal, item.portion, item.note]
                        .filter(Boolean)
                        .join(" · ")
                    }
                    accessory="chevron"
                    onClick={() => sheet.openCheckin({ day, existing: item })}
                  />
                ))}
                <ActionRow
                  icon={<Plus size={16} strokeWidth={2.4} />}
                  onClick={() => sheet.openCheckin({ day })}
                >
                  记一笔饮食
                </ActionRow>
              </>
            )}
          </Section>
        </div>
      )}

      {/* 看今天时预告未来一周的安排，点进去就是那天 */}
      {isToday && upcomingPlans.length > 0 ? (
        <div className="px-5">
          <Section title="接下来的安排" footer="未来七天 · 点击查看那天">
            {upcomingPlans.map((item) => {
              const d = parse(item.day);
              return (
                <ListRow
                  key={item.id}
                  leading={
                    <span className="flex h-[22px] w-[22px] items-center justify-center text-lake-deep">
                      <CalendarClock size={17} />
                    </span>
                  }
                  title={item.title}
                  subtitle={`${d.getMonth() + 1}月${d.getDate()}日 · 星期${WEEKDAYS[d.getDay()]} · ${item.meal}`}
                  accessory="chevron"
                  onClick={() => select(item.day)}
                />
              );
            })}
          </Section>
        </div>
      ) : null}

      {/* 常做菜谱：次数与「上次做于」已经是真数据，由打卡派生 */}
      <div className="px-5">
        <Section title="常做菜谱" footer="按制作次数排序，点击查看详情">
          {[...recipes]
            .sort((a, b) => b.cooked - a.cooked)
            .slice(0, 3)
            .map((recipe) => (
              <ListRow
                key={recipe.slug}
                leading={
                  recipe.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={recipe.image}
                      alt=""
                      className="h-10 w-10 rounded-thumb object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-thumb bg-tint text-indigo">
                      <Clock size={16} />
                    </span>
                  )
                }
                title={recipe.title}
                subtitle={`${recipe.category} · ${relativeDayLabel(recipe.lastCookedOn)} · 累计 ${recipe.cooked} 次`}
                accessory="chevron"
                onClick={() => router.push(`/recipes/${recipe.slug}`)}
              />
            ))}
        </Section>
      </div>

      <div className="px-5">
        <div className="grid grid-cols-3 gap-3">
          <Section padded className="text-center">
            <Stat value={stats.totals.activeDays} label="本月打卡天" tone="accent" />
          </Section>
          <Section padded className="text-center">
            <Stat value={stats.totals.checkins} label="累计记录" />
          </Section>
          <Section padded className="text-center">
            <Stat value={stats.totals.planned} label="待赴的安排" tone="lake" />
          </Section>
        </div>
      </div>

      <div style={{ height: layout.tabBottom }} aria-hidden />
    </div>
  );
}
