"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CalendarClock,
  Check,
  Clock,
  Heart,
  NotebookPen,
  Pencil,
  Users,
} from "lucide-react";
import {
  Badge,
  BottomActionBar,
  Button,
  Caption,
  CheckCircle,
  EmptyState,
  IconButton,
  ListRow,
  Metric,
  Micro,
  NavBar,
  Pill,
  Section,
  Segmented,
  Skeleton,
  Stepper,
  Title,
} from "@/components/ds";
import { layout, motion as mt } from "@/design/tokens";
import { useCheckinSheet } from "@/components/app/CheckinProvider";
import { useRecipeEditor } from "@/components/app/AppModalProvider";
import { relativeDayLabel } from "@/lib/content";
import { scaleAmount } from "@/lib/scale-amount";
import { useRecipeHistory, useRecipes } from "@/lib/use-app-data";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** YYYY-MM-DD → "3 月 12 日 · 星期三" */
function dayLabel(day: string): string {
  const d = new Date(`${day}T12:00:00`);
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 · 星期${WEEKDAYS[d.getDay()]}`;
}

export default function RecipeDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { openCheckin } = useCheckinSheet();
  const { openEditRecipe } = useRecipeEditor();
  const { recipes, loading, updateRecipe } = useRecipes();
  const recipe = recipes.find((r) => r.slug === params.slug);
  const history = useRecipeHistory(recipe?.slug);

  const [tab, setTab] = useState<"ing" | "step" | "log">("ing");
  const [checked, setChecked] = useState<number[]>([]);
  /** 想做几人份；null = 跟着菜谱写的人份走 */
  const [servings, setServings] = useState<number | null>(null);

  const flat = useMemo(
    () => (recipe ? recipe.ingredients.flatMap((g) => g.items) : []),
    [recipe],
  );

  if (loading && !recipe) {
    return (
      <div className="space-y-5 px-5 pt-4">
        <Skeleton className="h-60 w-full" rounded="rounded-group" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-24 w-full" rounded="rounded-group" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="pt-2">
        <NavBar variant="compact" title="菜谱" onBack={() => router.replace("/recipes")} backLabel="菜谱" />
        <div className="px-5 py-10">
          <Section>
            <EmptyState
              icon={<BookOpen size={26} strokeWidth={1.6} />}
              title="这道菜不在了"
              description="它可能已被删除。"
              action={
                <Button size="sm" onClick={() => router.replace("/recipes")}>
                  返回菜谱库
                </Button>
              }
            />
          </Section>
        </div>
      </div>
    );
  }

  const toggleFavorite = () => {
    void updateRecipe(recipe.slug, { ...recipe, favorite: !recipe.favorite });
  };

  /** 当前想做的人份与缩放倍率 */
  const wanted = servings ?? recipe.servings;
  const factor = recipe.servings > 0 ? wanted / recipe.servings : 1;
  const scaled = factor !== 1;

  /** 只取有内容的笔记，最新的在前 */
  const notes = history.history.filter((h) => h.note.trim().length > 0);

  return (
    <div className="pb-32">
      {/* 范式 B：图片上的透明紧凑导航条 */}
      <div className="relative">
        <div className="h-60 w-full bg-fill">
          {recipe.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.image} alt={recipe.title} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-tint text-indigo">
              <BookOpen size={32} />
            </span>
          )}
        </div>
        <div className="absolute inset-x-0 top-0">
          <NavBar
            variant="compact"
            transparent
            onBack={() => router.push("/recipes")}
            backLabel=""
            trailing={
              <>
                <IconButton
                  label={recipe.favorite ? "取消收藏" : "收藏"}
                  variant="glass"
                  onClick={toggleFavorite}
                >
                  <Heart
                    size={17}
                    fill={recipe.favorite ? "currentColor" : "none"}
                  />
                </IconButton>
                <IconButton
                  label="编辑菜谱"
                  variant="glass"
                  onClick={() => openEditRecipe(recipe.slug)}
                >
                  <Pencil size={16} />
                </IconButton>
              </>
            }
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
      </div>

      <div className="relative -mt-4 flex flex-col gap-6 rounded-t-sheet bg-paper px-5 pt-5">
        <Section padded>
          <Micro tone="accent">{recipe.category}</Micro>
          <Title as="h1" className="mt-1.5">
            {recipe.title}
          </Title>
          {recipe.subtitle ? (
            <Caption className="mt-1.5 block leading-relaxed">{recipe.subtitle}</Caption>
          ) : null}
          {recipe.tags.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {recipe.tags.map((t) => (
                <Pill key={t} size="sm">
                  {t}
                </Pill>
              ))}
            </div>
          ) : null}
        </Section>

        <Section padded>
          <div className="grid grid-cols-3 divide-x divide-hair">
            {[
              { icon: <Clock size={15} />, value: recipe.minutes, unit: "分钟" },
              { icon: <Users size={15} />, value: recipe.servings, unit: "人份" },
              { icon: <Check size={15} />, value: recipe.cooked, unit: "做过" },
            ].map((s) => (
              <div key={s.unit} className="flex flex-col items-center gap-1 px-2 first:pl-0 last:pr-0">
                <span className="text-muted">{s.icon}</span>
                <Metric className="text-[22px]">{s.value}</Metric>
                <Micro>{s.unit}</Micro>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-hair pt-3.5">
            <Micro>{relativeDayLabel(recipe.lastCookedOn)}</Micro>
            {history.planned.length > 0 ? (
              <Badge tone="lake">
                已安排 {dayLabel(history.planned[0].day).replace(" · ", " ")}
              </Badge>
            ) : null}
          </div>
        </Section>

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "ing", label: `食材 ${flat.length}` },
            { value: "step", label: `步骤 ${recipe.steps.length}` },
            { value: "log", label: `记录 ${history.history.length}` },
          ]}
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: mt.duration.fast }}
            className="flex flex-col gap-5"
          >
            {tab === "ing" ? (
              <>
                {/* 人份换算：只影响展示，不改菜谱本身 */}
                <Section
                  padded
                  footer={
                    scaled
                      ? `用量已按 ${recipe.servings} → ${wanted} 人份换算，菜谱本身未修改`
                      : "改人份，下方用量跟着变"
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Micro>做几人份</Micro>
                      <Caption className="mt-0.5 block">
                        {scaled ? `原方 ${recipe.servings} 人份` : "按菜谱原方"}
                      </Caption>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Stepper
                        value={wanted}
                        onChange={setServings}
                        min={1}
                        max={20}
                        suffix=" 人份"
                        label="人份"
                      />
                      {scaled ? (
                        <button
                          type="button"
                          onClick={() => setServings(null)}
                          className="shrink-0 px-1 text-[13px] font-medium text-indigo active:opacity-50"
                        >
                          复原
                        </button>
                      ) : null}
                    </div>
                  </div>
                </Section>

                {recipe.ingredients.map((group, gi) => {
                  const offset = recipe.ingredients
                    .slice(0, gi)
                    .reduce((s, g) => s + g.items.length, 0);
                  const groupChecked = group.items.filter((_, ii) =>
                    checked.includes(offset + ii),
                  ).length;
                  return (
                    <Section
                      key={group.group}
                      title={group.group}
                      footer={
                        groupChecked === group.items.length && group.items.length > 0
                          ? "这一组已备齐"
                          : undefined
                      }
                    >
                      {group.items.map((item, ii) => {
                        const idx = offset + ii;
                        const on = checked.includes(idx);
                        return (
                          <ListRow
                            key={`${item.name}-${ii}`}
                            ariaLabel={item.name}
                            leading={<CheckCircle done={on} size={22} />}
                            title={
                              <span className={on ? "text-muted line-through" : undefined}>
                                {item.name}
                              </span>
                            }
                            value={
                              <span
                                className={`u-num tabular-nums ${scaled ? "font-semibold text-indigo" : ""}`}
                              >
                                {scaleAmount(item.amount, factor)}
                              </span>
                            }
                            onClick={() =>
                              setChecked((list) =>
                                list.includes(idx)
                                  ? list.filter((x) => x !== idx)
                                  : [...list, idx],
                              )
                            }
                          />
                        );
                      })}
                    </Section>
                  );
                })}
              </>
            ) : tab === "step" ? (
              recipe.steps.length ? (
                <Section title="步骤" footer="按顺序完成即可">
                  {recipe.steps.map((step, i) => (
                    <ListRow
                      key={i}
                      leading={
                        <span className="u-num flex h-[22px] w-[22px] items-center justify-center rounded-full bg-fill text-[12px] font-bold text-ink-soft">
                          {i + 1}
                        </span>
                      }
                      title={
                        <span className="block whitespace-normal text-body leading-relaxed text-ink">
                          {step}
                        </span>
                      }
                    />
                  ))}
                </Section>
              ) : (
                <Section>
                  <EmptyState
                    icon={<BookOpen size={24} strokeWidth={1.6} />}
                    title="还没有写步骤"
                    description="做一次之后补上，下次就能照着做。"
                    action={
                      <Button
                        size="sm"
                        onClick={() => openEditRecipe(recipe.slug)}
                      >
                        去补充
                      </Button>
                    }
                  />
                </Section>
              )
            ) : (
              /* 记录页：做过的每一次，以及历次笔记。全部来自打卡数据 */
              <>
                {history.planned.length > 0 ? (
                  <Section title="已安排" footer="到那天在「今日」确认，就计入制作次数">
                    {history.planned.map((item) => (
                      <ListRow
                        key={item.id}
                        leading={
                          <span className="flex h-[22px] w-[22px] items-center justify-center text-lake-deep">
                            <CalendarClock size={17} />
                          </span>
                        }
                        title={dayLabel(item.day)}
                        subtitle={[item.meal, item.portion, item.note]
                          .filter(Boolean)
                          .join(" · ")}
                        accessory="chevron"
                        onClick={() => router.push(`/today?day=${item.day}`)}
                      />
                    ))}
                  </Section>
                ) : null}

                {notes.length > 0 ? (
                  <Section
                    title="历次笔记"
                    footer="打卡时写下的心得，最新的在前"
                  >
                    {notes.map((item) => (
                      <ListRow
                        key={item.id}
                        leading={
                          <span className="flex h-[22px] w-[22px] items-center justify-center text-indigo">
                            <NotebookPen size={16} />
                          </span>
                        }
                        title={
                          <span className="block whitespace-normal text-body leading-relaxed text-ink">
                            {item.note}
                          </span>
                        }
                        subtitle={`${dayLabel(item.day)} · ${item.meal}`}
                      />
                    ))}
                  </Section>
                ) : null}

                {history.loading ? (
                  <Section>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="u-sep flex items-center gap-3 px-4 py-3">
                        <Skeleton className="h-[22px] w-[22px]" rounded="rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-28" />
                          <Skeleton className="h-2.5 w-20" />
                        </div>
                      </div>
                    ))}
                  </Section>
                ) : history.history.length === 0 ? (
                  <Section>
                    <EmptyState
                      icon={<Check size={24} strokeWidth={1.8} />}
                      title="还没做过这道菜"
                      description="做完点底部的「做好了」，每一次都会出现在这里。"
                      action={
                        <Button size="sm" onClick={() => openCheckin({ recipe: recipe.slug })}>
                          记第一笔
                        </Button>
                      }
                    />
                  </Section>
                ) : (
                  <Section
                    title="做过的记录"
                    footer={`共 ${history.history.length} 次 · 点击跳到那一天`}
                  >
                    {history.history.map((item) => (
                      <ListRow
                        key={item.id}
                        ariaLabel={`查看 ${item.day}`}
                        leading={<CheckCircle done size={22} />}
                        title={dayLabel(item.day)}
                        subtitle={[item.time, item.meal, item.portion]
                          .filter(Boolean)
                          .join(" · ")}
                        accessory="chevron"
                        onClick={() => router.push(`/today?day=${item.day}`)}
                      />
                    ))}
                  </Section>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {tab === "ing" && flat.length > 0 ? (
          <Caption className="px-4 text-center">
            已备 {checked.length} / {flat.length} 项
          </Caption>
        ) : null}
      </div>

      <BottomActionBar
        caption={
          recipe.cooked > 0
            ? `${relativeDayLabel(recipe.lastCookedOn)} · 累计 ${recipe.cooked} 次`
            : "还没做过 · 做完记一笔，就会开始累计"
        }
      >
        <Button size="lg" block onClick={() => openCheckin({ recipe: recipe.slug })}>
          做好了，记一笔
        </Button>
      </BottomActionBar>

      <div style={{ height: layout.safeBottom }} aria-hidden />
    </div>
  );
}
