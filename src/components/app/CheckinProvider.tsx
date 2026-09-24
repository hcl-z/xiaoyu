"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  CalendarPlus,
  Camera,
  Check,
  Clock,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
  TextArea,
} from "@/components/ds";
import { motion as mt } from "@/design/tokens";
import { PhotoCheckinPage } from "@/components/app/PhotoCheckinPage";
import { todayISO } from "@/lib/content";
import { preparePhoto, uploadPhoto, type PreparedPhoto } from "@/lib/photo";
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
type PhotoOpts = { day?: string; meal?: string; existing?: Checkin };

type CheckinCtx = {
  checkins: Checkin[];
  loading: boolean;
  openCheckin: (opts?: OpenOpts) => void;
  /** 照片打卡：与菜谱打卡共用同一种底部弹窗 */
  openPhotoCheckin: (opts?: PhotoOpts) => void;
  /** 把一条计划直接确认为已吃，不必打开弹层 */
  confirmPlan: (record: Checkin) => Promise<void>;
};

const Ctx = createContext<CheckinCtx | null>(null);

export function useCheckinSheet(): CheckinCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCheckinSheet must be used within CheckinProvider");
  return ctx;
}

export function CheckinProvider({ children }: { children: ReactNode }) {
  const today = todayISO();
  const { checkins, loading, addCheckin, patchCheckin, removeCheckin } = useCheckins();
  const { recipes, loading: recipesLoading } = useRecipes();

  const [open, setOpen] = useState(false);
  const [meal, setMeal] = useState<string>("正餐");
  const [day, setDay] = useState(today);
  const [existing, setExisting] = useState<Checkin | undefined>();
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState<string | null>(null);
  const [portion, setPortion] = useState("1");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  /* ---- 照片打卡：同一种底部弹窗，但体裁是「拼一张卡片」而不是填表单 ---- */
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoDay, setPhotoDay] = useState(today);
  /** 餐次按时间自动推断，界面上不再让用户选 */
  const [photoMeal, setPhotoMeal] = useState<string>("正餐");
  /** 卡片上那一句话；存为 title，所以时间轴上直接显示用户自己的词 */
  const [photoCaption, setPhotoCaption] = useState("");
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoSaved, setPhotoSaved] = useState(false);

  /** 预览用的 objectURL 必须显式释放，否则多次选图会泄露内存 */
  const releasePhoto = useCallback(() => {
    setPhoto((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, []);

  const openPhotoCheckin = useCallback(
    (opts?: PhotoOpts) => {
      releasePhoto();
      setPhotoDay(opts?.day ?? today);
      setPhotoMeal(opts?.meal ?? smartMeal());
      setPhotoCaption("");
      setPhotoError("");
      setPhotoBusy(false);
      setPhotoSaved(false);
      setPhotoOpen(true);
    },
    [releasePhoto, today],
  );

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError("");
    setPhotoBusy(true);
    try {
      const prepared = await preparePhoto(file);
      releasePhoto();
      setPhoto(prepared);
    } catch {
      setPhotoError("这张图读不出来，换一张试试");
    } finally {
      setPhotoBusy(false);
      // 清空才能连续选同一张图
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const photoDayLabel =
    photoDay === today
      ? "今天"
      : `${new Date(`${photoDay}T12:00:00`).getMonth() + 1}月${new Date(`${photoDay}T12:00:00`).getDate()}日`;
  /** 整页顶部的日期行：2026 年 9 月 23 日 · 星期三 */
  const photoDateLine = (() => {
    const d = new Date(`${photoDay}T12:00:00`);
    const wd = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 · 星期${wd}`;
  })();
  const canSavePhoto = photo !== null && !photoBusy && !photoSaved;

  const closePhoto = () => {
    setPhotoOpen(false);
    releasePhoto();
  };

  const savePhoto = async () => {
    if (!photo || !canSavePhoto) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      const photoId = await uploadPhoto(photo);
      setPhotoSaved(true);
      await addCheckin({
        day: photoDay,
        meal: photoMeal,
        // 文案可空，照片本身就是内容
        title: photoCaption.trim() || "照片记录",
        recipeSlug: null,
        portion: "1 份",
        note: "",
        photoId,
      });
      window.setTimeout(() => {
        setPhotoOpen(false);
        setPhotoSaved(false);
        releasePhoto();
      }, 700);
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "保存失败");
      setPhotoSaved(false);
    } finally {
      setPhotoBusy(false);
    }
  };

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
      setNote(record?.note ?? "");
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

  /** 未来日期写入的是「计划」；改一条已有记录时沛用它自己的属性 */
  const isPlan = existing ? existing.planned : day > today;
  const verb = isPlan ? "安排" : "记录";

  const save = () => {
    if (!canSave || saved) return;
    setSaved(true);
    window.setTimeout(async () => {
      if (existing) {
        await patchCheckin(
          existing.id,
          {
            day,
            meal,
            title: title.trim(),
            recipeSlug: slug,
            portion: portionLabel,
            note: note.trim(),
            planned: isPlan,
          },
          existing.day,
        );
      } else {
        await addCheckin({
          day,
          meal,
          title: title.trim(),
          recipeSlug: slug,
          portion: portionLabel,
          note: note.trim(),
          planned: isPlan,
        });
      }
      setOpen(false);
      setSaved(false);
    }, 700);
  };

  /** 计划 → 已吃：只翻 planned 一个字段，时间改为当下 */
  const confirmPlan = useCallback(
    async (record: Checkin) => {
      await patchCheckin(
        record.id,
        { planned: false, time: new Date().toTimeString().slice(0, 5) },
        record.day,
      );
    },
    [patchCheckin],
  );

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
    () => ({ checkins, loading, openCheckin, openPhotoCheckin, confirmPlan }),
    [checkins, loading, openCheckin, openPhotoCheckin, confirmPlan],
  );

  return (
    <Ctx.Provider value={value}>
      {children}

      <Sheet
        open={open}
        onClose={close}
        title={existing ? (isPlan ? "修改计划" : "修改记录") : isPlan ? "安排一餐" : "记一笔"}
        subtitle={`${dayLabel} · ${meal}`}
        action={
          canSave
            ? { label: existing ? "更新" : "保存", onClick: save, disabled: saved }
            : undefined
        }
        footer={
          <Button size="lg" block disabled={!canSave || saved} onClick={save}>
            {saved
              ? "保存中…"
              : existing
                ? `更新${dayLabel}${isPlan ? "计划" : "记录"}`
                : `${verb}到${dayLabel}`}
          </Button>
        }
      >
        <div className="space-y-5 pb-2">
          {existing?.photoId ? (
            <div className="overflow-hidden rounded-group border border-hair/70 bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/photos/${existing.photoId}`}
                alt="这条记录的照片"
                className="max-h-48 w-full bg-fill object-cover"
              />
              <div className="border-t border-hair/70 px-4 py-2.5">
                <Micro>照片打卡 · 照片不可更换，删除记录会一并删除</Micro>
              </div>
            </div>
          ) : null}

          {isPlan ? (
            <div className="flex items-start gap-2.5 rounded-group bg-tint px-4 py-3">
              <span className="mt-0.5 shrink-0 text-indigo">
                <CalendarPlus size={16} />
              </span>
              <Caption className="block leading-relaxed">
                {day > today
                  ? `${dayLabel}还没到，这会存成一条用餐计划。到那天在「今日」确认一下，就计入打卡与菜谱的制作次数。`
                  : "这是一条尚未确认的计划，确认后才计入打卡与菜谱的制作次数。"}
              </Caption>
            </div>
          ) : null}

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

          {/* 这次做的心得：绑定了菜谱时会聚合到详情页的「历次笔记」 */}
          <Section
            tone="deep"
            title={isPlan ? "备忘" : "这次的笔记"}
            footer={
              selected
                ? isPlan
                  ? `要买什么、提前做什么，写在这里`
                  : `会出现在「${selected.title}」的历次笔记里`
                : "火候、用量、下次想改什么——可空着"
            }
          >
            <div className="px-4 py-3">
              <TextArea
                value={note}
                onChange={setNote}
                rows={2}
                placeholder={isPlan ? "例：周三买牛腩，提前一晚解冻" : "例：糖减一半刚好，收汁多给 5 分钟"}
              />
            </div>
          </Section>

          {existing && existing.planned ? (
            <Section tone="deep" footer="确认后这条就算真的吃过，并计入菜谱的制作次数">
              <ListRow
                leading={
                  <span className="flex h-[22px] w-[22px] items-center justify-center text-lake-deep">
                    <Check size={17} strokeWidth={2.6} />
                  </span>
                }
                title="按计划吃了，确认一下"
                subtitle="从计划转为已记录"
                accessory="chevron"
                onClick={() => {
                  if (!existing) return;
                  setSaved(true);
                  void confirmPlan(existing).then(() => {
                    window.setTimeout(() => {
                      setOpen(false);
                      setSaved(false);
                    }, 500);
                  });
                }}
              />
            </Section>
          ) : null}

          {existing ? (
            <Section tone="deep">
              <ListRow
                leading={
                  <span className="flex h-[22px] w-[22px] items-center justify-center text-danger">
                    <Trash2 size={17} />
                  </span>
                }
                title={existing.planned ? "取消这条计划" : "删除这条记录"}
                destructive
                onClick={() => setConfirmDelete(true)}
              />
            </Section>
          ) : null}

          <div className="flex items-center justify-between rounded-group border border-hair/70 bg-paper px-4 py-3.5">
            <div className="min-w-0">
              <Micro>{isPlan ? "将安排为" : "将保存为"}</Micro>
              <p className="mt-1 truncate text-[15px] font-medium text-ink">
                {title.trim() || "还没选择"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isPlan ? <Badge tone="lake">计划</Badge> : null}
              <Badge tone="gray">{meal}</Badge>
              <Badge tone="accent">{portionLabel}</Badge>
            </div>
          </div>
        </div>

        <SuccessOverlay
          open={saved}
          title={existing ? "已更新" : isPlan ? `已安排到${dayLabel}` : `已记录到${dayLabel}`}
          caption={`${meal} · ${portionLabel}`}
        />
      </Sheet>

      <Alert
        open={confirmDelete}
        title={existing?.planned ? "取消这条计划？" : "删除这条记录？"}
        message={`${dayLabel}的${meal}将被移除，无法恢复。`}
        confirmLabel={existing?.planned ? "取消计划" : "删除"}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />

      {/* 照片打卡：独立整页层（点阵底 + 居中大卡片），不用底部弹层 */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void pickPhoto(e.target.files?.[0])}
      />

      <PhotoCheckinPage
        open={photoOpen}
        onClose={closePhoto}
        dayLabel={photoDayLabel}
        dateLine={photoDateLine}
        caption={photoCaption}
        onCaptionChange={setPhotoCaption}
        photo={photo}
        busy={photoBusy}
        error={photoError}
        saved={photoSaved}
        canSave={canSavePhoto}
        onPick={() => fileRef.current?.click()}
        onSave={() => void savePhoto()}
      />
    </Ctx.Provider>
  );
}

/**
 * 右下角悬浮主操作。
 *
 * 今天 / 过去：点击斜向扇出两枚子按钮——菜谱 0°（正左）、照片 45°（左上）。
 * 未来日期：FAB 是「安排计划」语义，那时拍照没意义，不展开菜单。
 *
 * 展开层必须 portal 到 body：外层容器带了 -translate-x-1/2，
 * 有 transform 的祖先会成为 fixed 的包含块，否则遮罩只能盖出一条横带。
 */
export function CheckinFab() {
  const { openCheckin, openPhotoCheckin } = useCheckinSheet();
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const fabRef = useRef<HTMLButtonElement>(null);
  const day = params.get("day") ?? todayISO();
  const future = day > todayISO();
  const [menuOpen, setMenuOpen] = useState(false);
  const [origin, setOrigin] = useState<{ cx: number; cy: number } | null>(null);
  // 未来日期不提供菜单，用派生值而不是在 effect 里回写 state
  const expanded = menuOpen && !future && origin !== null;

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  /**
   * 斜向扇出：以 FAB 中心为原点按极坐标排列，两枚按钮路径长度相等。
   * 角度整体抬高：正左方就是内容卡片的正文区，压上去会遮住数字；
   * 60° / 105° 让两枚按钮落在卡片上方的留白区，仍保持 45° 间隔。
   */
  const RADIUS = 112;
  const items = [
    {
      key: "recipe",
      angle: 60,
      label: "菜谱打卡",
      icon: <BookOpen size={20} />,
      onClick: () => openCheckin({ day }),
    },
    {
      key: "photo",
      angle: 105,
      label: "照片打卡",
      icon: <Camera size={20} />,
      onClick: () => openPhotoCheckin({ day }),
    },
  ].map((item) => {
    const rad = (item.angle * Math.PI) / 180;
    return {
      ...item,
      // 向左为负 x，向上为负 y
      dx: -Math.cos(rad) * RADIUS,
      dy: -Math.sin(rad) * RADIUS,
    };
  });

  const toggle = () => {
    const rect = fabRef.current?.getBoundingClientRect();
    if (rect) {
      setOrigin({ cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 });
    }
    setMenuOpen((v) => !v);
  };

  if (future) {
    return (
      <button
        type="button"
        aria-label="安排一道"
        onClick={() => openCheckin({ day })}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo text-white shadow-fab transition-transform active:scale-95"
      >
        <CalendarPlus size={24} strokeWidth={2.2} />
      </button>
    );
  }

  const layer =
    origin && typeof document !== "undefined"
      ? createPortal(
          <AnimatePresence>
            {expanded ? (
              <div className="fixed inset-0 z-[45]">
                {/* 透明点击层：只用于点外面收起，不做模糊不变暗 */}
                <button
                  type="button"
                  aria-label="收起"
                  onClick={() => setMenuOpen(false)}
                  className="absolute inset-0 cursor-default"
                />

                {items.map((item, i) => (
                  <motion.button
                    key={item.key}
                    type="button"
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => {
                      setMenuOpen(false);
                      item.onClick();
                    }}
                    className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-indigo text-white shadow-fab"
                    style={{ left: origin.cx, top: origin.cy }}
                    initial={
                      reduce
                        ? { opacity: 0, x: "-50%", y: "-50%" }
                        : { opacity: 0, x: "-50%", y: "-50%", scale: 0.5 }
                    }
                    animate={{
                      opacity: 1,
                      // -50% 先与 FAB 同心，再按极坐标位移
                      x: `calc(-50% + ${item.dx}px)`,
                      y: `calc(-50% + ${item.dy}px)`,
                      scale: 1,
                    }}
                    exit={
                      reduce
                        ? { opacity: 0, x: "-50%", y: "-50%" }
                        : { opacity: 0, x: "-50%", y: "-50%", scale: 0.5 }
                    }
                    transition={
                      reduce
                        ? { duration: mt.duration.fast }
                        : { ...mt.spring.pop, delay: i * 0.04 }
                    }
                    whileTap={{ scale: 0.92 }}
                  >
                    {item.icon}
                  </motion.button>
                ))}
              </div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <>
      {layer}
      <button
        ref={fabRef}
        type="button"
        aria-label={expanded ? "收起" : "记一笔"}
        aria-expanded={expanded}
        onClick={toggle}
        className="pointer-events-auto relative z-[46] flex h-14 w-14 items-center justify-center rounded-full bg-indigo text-white shadow-fab transition-transform active:scale-95"
      >
        <motion.span
          className="flex items-center justify-center"
          animate={{ rotate: expanded ? 45 : 0 }}
          transition={reduce ? { duration: 0 } : mt.spring.toggle}
        >
          <Plus size={26} strokeWidth={2.4} />
        </motion.span>
      </button>
    </>
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
