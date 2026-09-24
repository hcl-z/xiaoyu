"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Clock, Heart, Plus, Search, Users } from "lucide-react";
import {
  Caption,
  EmptyState,
  IconButton,
  ListRow,
  Micro,
  NavBar,
  Pill,
  SearchField,
  Section,
  Skeleton,
} from "@/components/ds";
import { layout } from "@/design/tokens";
import { useRecipeEditor } from "@/components/app/AppModalProvider";
import { relativeDayLabel } from "@/lib/content";
import { useRecipes, useTaxonomies } from "@/lib/use-app-data";

export default function RecipesPage() {
  const router = useRouter();
  const { openNewRecipe } = useRecipeEditor();
  const { recipes, loading } = useRecipes();
  const { categories } = useTaxonomies();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("全部");

  /** 分类来自「我的 › 分类管理」；另有「全部」与「收藏」筛选项 */
  const filters = useMemo(
    () => ["全部", ...categories.map((c) => c.name), "收藏"],
    [categories],
  );

  /** 选中的分类被删除后，自动回落到「全部」 */
  const activeCat = filters.includes(cat) ? cat : "全部";

  const list = useMemo(() => {
    let out = [...recipes];
    if (activeCat === "收藏") {
      out = out.filter((r) => r.favorite);
    } else if (activeCat !== "全部") {
      out = out.filter((r) => r.category === activeCat);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.subtitle.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          // 冰箱里有菠菜，搜「菠菜」就应该能找到菜谱
          r.ingredients.some((g) =>
            g.items.some((item) => item.name.toLowerCase().includes(q)),
          ),
      );
    }
    return out.sort((a, b) => b.cooked - a.cooked);
  }, [recipes, activeCat, query]);

  /* 大图仅在默认浏览态出现；筛选时结果平铺，避免首个结果被莫名放大 */
  const browsing = !query.trim() && activeCat === "全部";
  const featured = browsing ? list[0] : undefined;
  const rows = browsing ? list.slice(1) : list;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <NavBar
        variant="large"
        largeTitle="菜谱"
        subtitle={`${recipes.length} 道 · 按制作次数排序`}
        trailing={
          <IconButton label="新建菜谱" onClick={openNewRecipe}>
            <Plus size={24} strokeWidth={2.2} />
          </IconButton>
        }
      />

      <div className="space-y-3 px-5">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="搜菜名、标签或食材，如「菠菜」"
        />
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {filters.map((c) => (
            <Pill key={c} active={c === activeCat} onClick={() => setCat(c)}>
              {c}
            </Pill>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-5 px-5">
          <Skeleton className="h-44 w-full" rounded="rounded-group" />
          <Section>
            {[0, 1, 2].map((i) => (
              <div key={i} className="u-sep flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-12 w-12" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-2.5 w-40" />
                </div>
              </div>
            ))}
          </Section>
        </div>
      ) : list.length === 0 ? (
        <div className="px-5">
          <Section>
            <EmptyState
              icon={<Search size={26} strokeWidth={1.6} />}
              title="没有匹配的菜谱"
              description={
                query.trim()
                  ? `没有找到与「${query.trim()}」相关的菜谱，菜名、标签与食材都试过了。`
                  : activeCat === "收藏"
                    ? "还没有收藏任何菜谱。"
                    : "这个分类下还是空的。"
              }
              action={
                <div className="flex gap-2">
                  {query.trim() || activeCat !== "全部" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setCat("全部");
                      }}
                      className="h-8 rounded-control bg-fill px-3 text-[13px] font-semibold text-ink active:bg-fill-deep"
                    >
                      清除筛选
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={openNewRecipe}
                    className="h-8 rounded-control bg-indigo px-3 text-[13px] font-semibold text-white active:bg-indigo-deep"
                  >
                    新建菜谱
                  </button>
                </div>
              }
            />
          </Section>
        </div>
      ) : (
        <>
          {featured ? (
            <div className="px-5">
              <button
                type="button"
                onClick={() => router.push(`/recipes/${featured.slug}`)}
                className="group relative block h-44 w-full overflow-hidden rounded-group shadow-card active:opacity-90"
              >
                {featured.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.image}
                    alt={featured.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-tint text-indigo">
                    <BookOpen size={26} />
                  </span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 block p-4 text-left">
                  <Micro tone="invert" className="opacity-80">
                    做得最多
                  </Micro>
                  <span className="mt-1 block text-title font-bold text-white">
                    {featured.title}
                  </span>
                  <span className="mt-1 flex items-center gap-3 text-caption text-white/85">
                    <span className="u-num flex items-center gap-1">
                      <Clock size={12} />
                      {featured.minutes} 分钟
                    </span>
                    <span className="u-num flex items-center gap-1">
                      <Users size={12} />
                      {featured.servings} 人份
                    </span>
                    <span className="u-num">做过 {featured.cooked} 次</span>
                  </span>
                </span>
                {featured.favorite ? (
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-indigo backdrop-blur">
                    <Heart size={15} fill="currentColor" />
                  </span>
                ) : null}
              </button>
            </div>
          ) : null}

          <div className="px-5">
            <Section
              title={
                browsing
                  ? "全部菜谱"
                  : activeCat === "全部"
                    ? "搜索结果"
                    : activeCat
              }
              footer={`共 ${list.length} 道`}
            >
              {rows.map((r) => (
                <ListRow
                  key={r.slug}
                  ariaLabel={r.title}
                  onClick={() => router.push(`/recipes/${r.slug}`)}
                  leading={
                    r.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.image}
                        alt=""
                        className="h-12 w-12 rounded-thumb object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-thumb bg-tint text-indigo">
                        <BookOpen size={18} />
                      </span>
                    )
                  }
                  title={
                    <span className="flex items-center gap-1.5">
                      <span className="truncate">{r.title}</span>
                      {r.favorite ? (
                        <Heart size={13} className="shrink-0 text-indigo" fill="currentColor" />
                      ) : null}
                    </span>
                  }
                  subtitle={`${r.category} · ${r.minutes} 分钟 · ${relativeDayLabel(r.lastCookedOn)}`}
                  value={
                    <span className="u-num text-caption tabular-nums">
                      {r.cooked ? `${r.cooked} 次` : "未做"}
                    </span>
                  }
                  accessory="chevron"
                />
              ))}
            </Section>
          </div>
        </>
      )}

      <div style={{ height: layout.safeBottom }} aria-hidden />
    </div>
  );
}
