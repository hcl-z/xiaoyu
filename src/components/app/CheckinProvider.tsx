"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Clock, Plus, Search, Trash2 } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Caption,
  Checkmark,
  ListRow,
  Micro,
  SearchField,
  Section,
  Segmented,
  Sheet,
  Skeleton,
  SuccessOverlay,
} from "@/components/ds";
import { todayISO } from "@/lib/content";
import { useCheckins, useRecipes, type Checkin } from "@/lib/use-app-data";

const INTAKE_TAGS = ["正餐", "加餐", "轻食", "下午茶", "夜宵"] as const;
const PORTIONS = [
  { value: "0.5", label: "½ 份" },
  { value: "1", label: "1 份" },
  { value: "1.5", label: "1.5 份" },
];

/** 按当前时间智能推荐餐别标签，随吃随记 */
export function smartMeal(d = new Date()): string {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 21 || h < 5) return "夜宵";
  if (h >= 14 && h < 17) return "加餐";
  if (h >= 6 && h < 10) return "轻食";
  return "正餐";
}

type OpenOpts = { meal?: string; recipe?: string | null; day?: string; existing?: Checkin };

type CheckinCtx = {
  checkins: Checkin[];
  loading: boolean;
  openCheckin: (opts?: OpenOpts) => void;
};

const Ctx = createContext<CheckinCtx | null>(null);

export function useCheckinSheet(): CheckinCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCheckinSheet must be used within CheckinProvider");
  return ctx;
}

export function CheckinProvider({ children }: { children: ReactNode }) {
  const today = todayISO();
  const { checkins, loading, addCheckin, removeCheckin } = useCheckins();
  const { recipes, loading: recipesLoading } = useRecipes();

  const [open, setOpen] = useState(false);
  const [meal, setMeal] = useState<string>("正餐");
  const [day, setDay] = useState(today);
  const [existing, setExisting] = useState<Checkin | undefined>();
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState<string | null>(null);
  const [portion, setPortion] = useState("1");
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const openCheckin = useCallback(
    (opts?: OpenOpts) => {
      const record = opts?.existing;
      setDay(opts?.day ?? record?.day ?? today);
      setMeal(record?.meal ?? opts?.meal ?? smartMeal());
      setExisting(record);
      setSlug(record?.recipeSlug ?? opts?.recipe ?? null);
      setQuery("");
      setPortion(
        record?.portion.startsWith("½") || record?.portion.startsWith("0.5")
          ? "0.5"
          : record?.portion.startsWith("1.5")
            ? "1.5"
            : "1",
      );
      setSaved(false);
      setConfirmDelete(false);
      setOpen(true);
    },
    [today],
  );

  const close = () => setOpen(false);

  /* 一个字段承担两件事：过滤菜谱；无匹配时首行即「添加"xxx"」 */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = recipes.filter((r) => r.slug !== slug);
    if (!q) return pool.slice(0, 6);
    return pool
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          r.category.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, recipes, slug]);

  const selected = recipes.find((r) => r.slug === slug) ?? null;
  const manualTitle = existing && !selected ? (query.trim() || existing.title) : query.trim();
  const isManual = slug === null;
  const title = selected?.title ?? (isManual ? manualTitle || (existing?.title ?? "") : "");
  const canSave = title.trim().length > 0;
  const portionLabel = PORTIONS.find((p) => p.value === portion)?.label ?? "1 份";
  const dayLabel = day === today ? "今天" : `${new Date(`${day}T12:00:00`).getMonth() + 1}月${new Date(`${day}T12:00:00`).getDate()}日`;

  const save = () => {
    if (!canSave || saved) return;
    setSaved(true);
    window.setTimeout(async () => {
      if (existing) await removeCheckin(existing.id, day);
      await addCheckin({
        day,
        meal,
        title: title.trim(),
        recipeSlug: slug,
        portion: portionLabel,
      });
      setOpen(false);
      setSaved(false);
    }, 700);
  };

  const remove = async () => {
    if (!existing) return;
    setConfirmDelete(false);
    setSaved(true);
    await removeCheckin(existing.id, day);
    window.setTimeout(() => {
      setOpen(false);
      setSaved(false);
      setExisting(undefined);
    }, 500);
  };

  const value = useMemo(
    () => ({ checkins, loading, openCheckin }),
    [checkins, loading, openCheckin],
  );

  return (
    <Ctx.Provider value={value}>
      {children}

      <Sheet
        open={open}
        onClose={close}
        title={existing ? "修改记录" : "记一笔"}
        subtitle={`${dayLabel} · ${meal}`}
        action={
          canSave
            ? { label: existing ? "更新" : "保存", onClick: save, disabled: saved }
            : undefined
        }
        footer={
          <Button size="lg" block disabled={!canSave || saved} onClick={save}>
            {saved ? "保存中…" : existing ? `更新${dayLabel}记录` : `保存到${dayLabel}`}
          </Button>
        }
      >
        <div className="space-y-5 pb-2">
          <Segmented
            value={meal}
            onChange={setMeal}
            options={(INTAKE_TAGS as readonly string[]).includes(meal)
              ? INTAKE_TAGS.map((m) => ({ value: m, label: m }))
              : [{ value: meal, label: meal }, ...INTAKE_TAGS.map((m) => ({ value: m, label: m }))]}
          />

          <SearchField
            value={query}
            onChange={(v) => {
              setQuery(v);
              if (v) setSlug(null);
            }}
            placeholder="搜索菜谱，或直接输入吃了什么"
            autoFocus={isManual && !existing}
          />

          {selected ? (
            <Section tone="deep">
              <ListRow
                leading={
                  selected.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.image}
                      alt=""
                      className="h-10 w-10 rounded-thumb object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-thumb bg-tint text-indigo">
                      <BookOpen size={16} />
                    </span>
                  )
                }
                title={selected.title}
                subtitle={`${selected.category} · ${selected.minutes} 分钟`}
                trailing={<Checkmark on />}
              />
              <button
                type="button"
                onClick={() => setSlug(null)}
                className="u-press w-full px-4 py-2.5 text-left text-[15px] text-indigo"
              >
                重新选择
              </button>
            </Section>
          ) : (
            <Section
              title={query.trim() ? "搜索结果" : "最近吃过"}
              footer={
                query.trim()
                  ? `没有想要的？直接保存为「${query.trim()}」`
                  : "输入名称可搜索全部菜谱"
              }
            >
              {query.trim() ? (
                <ListRow
                  leading={
                    <span className="flex h-10 w-10 items-center justify-center rounded-thumb bg-fill text-muted">
                      <Plus size={17} />
                    </span>
                  }
                  title={`添加「${query.trim()}」`}
                  subtitle="作为自定义记录保存"
                  accessory="chevron"
                  onClick={save}
                />
              ) : null}
              {recipesLoading ? (
                <>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="u-sep flex items-center gap-3 px-4 py-3">
                      <Skeleton className="h-10 w-10" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-2.5 w-20" />
                      </div>
                    </div>
                  ))}
                </>
              ) : results.length === 0 && !query.trim() ? (
                <div className="px-4 py-8 text-center">
                  <Caption>菜谱库还是空的，先在输入框里写下吃了什么</Caption>
                </div>
              ) : (
                results.map((r) => (
                  <ListRow
                    key={r.slug}
                    leading={
                      r.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.image}
                          alt=""
                          className="h-10 w-10 rounded-thumb object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-thumb bg-tint text-indigo">
                          <BookOpen size={16} />
                        </span>
                      )
                    }
                    title={r.title}
                    subtitle={`${r.category} · ${r.minutes} 分钟`}
                    value={
                      <span className="flex items-center gap-1 text-caption text-muted">
                        <Clock size={12} />
                        {r.minutes}′
                      </span>
                    }
                    onClick={() => {
                      setSlug(r.slug);
                      setQuery("");
                    }}
                  />
                ))
              )}
            </Section>
          )}

          <Section tone="deep" title="份量" padded>
            <Segmented value={portion} onChange={setPortion} options={PORTIONS} />
          </Section>

          {existing ? (
            <Section tone="deep">
              <ListRow
                leading={
                  <span className="flex h-[22px] w-[22px] items-center justify-center text-danger">
                    <Trash2 size={17} />
                  </span>
                }
                title="删除这条记录"
                destructive
                onClick={() => setConfirmDelete(true)}
              />
            </Section>
          ) : null}

          <div className="flex items-center justify-between rounded-group border border-hair/70 bg-paper px-4 py-3.5">
            <div className="min-w-0">
              <Micro>将保存为</Micro>
              <p className="mt-1 truncate text-[15px] font-medium text-ink">
                {title.trim() || "还没选择"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone="gray">{meal}</Badge>
              <Badge tone="accent">{portionLabel}</Badge>
            </div>
          </div>
        </div>

        <SuccessOverlay
          open={saved}
          title={existing ? "已更新" : `已记录到${dayLabel}`}
          caption={`${meal} · ${portionLabel}`}
        />
      </Sheet>

      <Alert
        open={confirmDelete}
        title="删除这条记录？"
        message={`${dayLabel}的${meal}将从历史中移除，无法恢复。`}
        confirmLabel="删除"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </Ctx.Provider>
  );
}

/** 右下角悬浮主操作：写入当前正在查看的日期 */
export function CheckinFab() {
  const { openCheckin } = useCheckinSheet();
  return (
    <button
      type="button"
      aria-label="记一笔"
      onClick={() => {
        const day = new URLSearchParams(window.location.search).get("day") ?? todayISO();
        openCheckin({ day });
      }}
      className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo text-white shadow-fab transition-transform active:scale-95"
    >
      <Plus size={26} strokeWidth={2.4} />
    </button>
  );
}

/** /checkin 深链：重定向后自动展开弹层 */
export function CheckinDeepLink() {
  const router = useRouter();
  const { openCheckin } = useCheckinSheet();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("checkin")) {
        openCheckin({ meal: sp.get("meal") ?? undefined, recipe: sp.get("recipe") });
        router.replace("/today", { scroll: false });
      }
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/** 供搜索图标在文档中复用 */
export const CheckinSearchIcon = Search;
