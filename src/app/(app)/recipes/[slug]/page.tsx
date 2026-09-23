"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Check, Clock, Heart, Pencil, Users } from "lucide-react";
import {
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
  Title,
} from "@/components/ds";
import { layout, motion as mt } from "@/design/tokens";
import { useCheckinSheet } from "@/components/app/CheckinProvider";
import { useRecipes } from "@/lib/use-app-data";

export default function RecipeDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { openCheckin } = useCheckinSheet();
  const { recipes, loading, updateRecipe } = useRecipes();
  const recipe = recipes.find((r) => r.slug === params.slug);

  const [tab, setTab] = useState<"ing" | "step">("ing");
  const [checked, setChecked] = useState<number[]>([]);

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
                  onClick={() => router.push(`/recipes/${recipe.slug}/edit`)}
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
        </Section>

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "ing", label: `食材 ${flat.length}` },
            { value: "step", label: `步骤 ${recipe.steps.length}` },
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
              recipe.ingredients.map((group, gi) => {
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
                          value={<span className="u-num tabular-nums">{item.amount}</span>}
                          onClick={() =>
                            setChecked((list) =>
                              list.includes(idx) ? list.filter((x) => x !== idx) : [...list, idx],
                            )
                          }
                        />
                      );
                    })}
                  </Section>
                );
              })
            ) : recipe.steps.length ? (
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
                      onClick={() => router.push(`/recipes/${recipe.slug}/edit`)}
                    >
                      去补充
                    </Button>
                  }
                />
              </Section>
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
        caption={`上次做于 3 天前 · 累计 ${recipe.cooked} 次`}
      >
        <Button size="lg" block onClick={() => openCheckin({ recipe: recipe.slug })}>
          做好了，记一笔
        </Button>
      </BottomActionBar>

      <div style={{ height: layout.safeBottom }} aria-hidden />
    </div>
  );
}
