"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  Alert,
  Caption,
  Checkmark,
  FieldRow,
  IconButton,
  ListRow,
  Micro,
  NavBar,
  Pill,
  Section,
  Stepper,
  TextArea,
  TextInput,
} from "@/components/ds";
import { useRecipes, useTaxonomies, type Recipe } from "@/lib/use-app-data";

type Item = { name: string; amount: string };
type Group = { group: string; items: Item[] };

/** 保证当前值始终可见，即使它已被从分类/标签库中删除 */
function withCurrent(options: string[], current: string[]): string[] {
  const extra = current.filter((v) => v && !options.includes(v));
  return [...options, ...extra];
}

export function RecipeEditor({ mode, recipe }: { mode: "new" | "edit"; recipe?: Recipe }) {
  const router = useRouter();
  const { addRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const { categories, tags: tagLibrary, addTaxonomy } = useTaxonomies();

  const [title, setTitle] = useState(recipe?.title ?? "");
  const [subtitle, setSubtitle] = useState(recipe?.subtitle ?? "");
  const [category, setCategory] = useState<string>(recipe?.category ?? "");
  const [minutes, setMinutes] = useState(recipe?.minutes ?? 20);
  const [servings, setServings] = useState(recipe?.servings ?? 2);
  const [tags, setTags] = useState<string[]>(recipe?.tags ?? []);
  const [groups, setGroups] = useState<Group[]>(
    recipe?.ingredients.length
      ? recipe.ingredients.map((g) => ({ group: g.group, items: [...g.items] }))
      : [{ group: "主料", items: [{ name: "", amount: "" }] }],
  );
  const [steps, setSteps] = useState<string[]>(
    recipe?.steps.length ? [...recipe.steps] : [""],
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  /* 就地新建标签：与「标签管理」共用同一套数据，建完立即选中 */
  const [composingTag, setComposingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [tagError, setTagError] = useState("");

  const categoryOptions = useMemo(
    () => withCurrent(categories.map((c) => c.name), [category]),
    [categories, category],
  );
  /** 新建时若未选择，默认落在分类库的第一项（无副作用，纯派生） */
  const activeCategory = category || categoryOptions[0] || "";
  const tagOptions = useMemo(
    () => withCurrent(tagLibrary.map((t) => t.name), tags),
    [tagLibrary, tags],
  );

  const valid = title.trim().length > 0;

  /** 新建标签：已存在则直接选中，不报错打断录入 */
  const commitTag = async () => {
    const value = tagDraft.trim();
    if (!value || addingTag) return;

    if (tagOptions.includes(value)) {
      setTags((list) => (list.includes(value) ? list : [...list, value]));
      setTagDraft("");
      setComposingTag(false);
      setTagError("");
      return;
    }

    setAddingTag(true);
    setTagError("");
    const res = await addTaxonomy("tag", value);
    setAddingTag(false);
    if (res.ok) {
      setTags((list) => (list.includes(value) ? list : [...list, value]));
      setTagDraft("");
      setComposingTag(false);
    } else {
      setTagError(res.error ?? "添加失败");
    }
  };

  const setItem = (gi: number, ii: number, patch: Partial<Item>) =>
    setGroups((list) =>
      list.map((g, i) =>
        i === gi
          ? { ...g, items: g.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) }
          : g,
      ),
    );

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const draft: Recipe = {
      slug: recipe?.slug ?? `custom-${Date.now().toString(36)}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: activeCategory,
      minutes,
      servings,
      image: recipe?.image ?? "",
      favorite: recipe?.favorite ?? false,
      cooked: recipe?.cooked ?? 0,
      tags,
      ingredients: groups
        .map((g) => ({
          group: g.group.trim() || "食材",
          items: g.items
            .filter((it) => it.name.trim())
            .map((it) => ({ name: it.name.trim(), amount: it.amount.trim() || "适量" })),
        }))
        .filter((g) => g.items.length > 0),
      steps: steps.map((s) => s.trim()).filter(Boolean),
    };
    const saved =
      mode === "edit" && recipe
        ? await updateRecipe(recipe.slug, draft)
        : await addRecipe(draft);
    router.replace(`/recipes/${saved.slug}`);
  };

  const remove = async () => {
    if (!recipe) return;
    setConfirmDelete(false);
    setSaving(true);
    await deleteRecipe(recipe.slug);
    router.replace("/recipes");
  };

  return (
    <div className="pb-10">
      <NavBar
        variant="compact"
        title={mode === "edit" ? "编辑菜谱" : "新建菜谱"}
        backLabel=""
        leading={
          <button
            type="button"
            onClick={() => router.back()}
            className="px-2 py-1 text-[17px] text-indigo active:opacity-50"
          >
            取消
          </button>
        }
        trailing={
          <button
            type="button"
            onClick={save}
            disabled={!valid || saving}
            className="px-2 py-1 text-[17px] font-semibold text-indigo disabled:text-muted/35"
          >
            {saving ? "保存中" : "完成"}
          </button>
        }
      />

      <div className="flex flex-col gap-6 px-5 pt-5">
        <Section title="基本信息" footer={valid ? undefined : "名称是唯一的必填项"}>
          <div className="u-sep flex min-h-11 items-center gap-3 px-4 py-2.5">
            <span className="w-14 shrink-0 text-body text-ink">名称</span>
            <TextInput
              value={title}
              onChange={setTitle}
              align="left"
              autoFocus={mode === "new"}
              placeholder="例如：番茄牛腩饭"
            />
          </div>
          <div className="flex min-h-11 items-center gap-3 px-4 py-2.5">
            <span className="w-14 shrink-0 text-body text-ink">备注</span>
            <TextInput
              value={subtitle}
              onChange={setSubtitle}
              align="left"
              placeholder="一句话说明这道菜（可选）"
            />
          </div>
        </Section>

        <Section
          title="分类"
          footer="分类可在「我的 › 分类管理」中增删改"
        >
          {categoryOptions.map((c) => (
            <ListRow
              key={c}
              title={c}
              accessory="check"
              selected={activeCategory === c}
              onClick={() => setCategory(c)}
            />
          ))}
        </Section>

        <Section title="烹饪">
          <div className="u-sep">
            <FieldRow label="用时">
              <Stepper
                label="用时"
                value={minutes}
                onChange={setMinutes}
                min={5}
                max={240}
                suffix=" 分钟"
              />
            </FieldRow>
          </div>
          <FieldRow label="份量">
            <Stepper
              label="份量"
              value={servings}
              onChange={setServings}
              min={1}
              max={12}
              suffix=" 人份"
            />
          </FieldRow>
        </Section>

        <Section
          title="标签"
          footer={
            tagError
              ? undefined
              : "可多选 · 新建的标签会同时加入「我的 › 标签管理」"
          }
          padded
        >
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((t) => (
              <Pill
                key={t}
                active={tags.includes(t)}
                onClick={() =>
                  setTags((list) =>
                    list.includes(t) ? list.filter((x) => x !== t) : [...list, t],
                  )
                }
              >
                {t}
              </Pill>
            ))}
            {/* 就地新建：不必离开编辑器去管理页 */}
            <button
              type="button"
              onClick={() => {
                setComposingTag(true);
                setTagError("");
              }}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-hair px-3.5 text-[13px] font-medium text-muted transition-colors hover:border-indigo/45 hover:text-indigo active:opacity-70"
            >
              <Plus size={13} strokeWidth={2.4} />
              新建标签
            </button>
          </div>

          {composingTag ? (
            <div className="mt-3 flex items-center gap-2 rounded-control border border-hair bg-paper px-3 py-2">
              <input
                value={tagDraft}
                autoFocus
                onChange={(e) => {
                  setTagDraft(e.target.value);
                  if (tagError) setTagError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void commitTag();
                  }
                  if (e.key === "Escape") {
                    setComposingTag(false);
                    setTagDraft("");
                    setTagError("");
                  }
                }}
                placeholder="标签名，回车即添加"
                aria-label="新建标签"
                className="w-full min-w-0 bg-transparent text-body text-ink outline-none placeholder:text-muted/70"
              />
              <button
                type="button"
                onClick={() => {
                  setComposingTag(false);
                  setTagDraft("");
                  setTagError("");
                }}
                className="shrink-0 text-[13px] text-muted active:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void commitTag()}
                disabled={!tagDraft.trim() || addingTag}
                className="shrink-0 text-[15px] font-semibold text-indigo active:opacity-50 disabled:text-muted/40"
              >
                {addingTag ? "添加中" : "添加"}
              </button>
            </div>
          ) : null}

          {tagError ? (
            <Caption tone="danger" className="mt-2 block leading-relaxed">
              {tagError}
            </Caption>
          ) : null}
        </Section>

        <div className="flex flex-col gap-5">
          {groups.map((group, gi) => (
            <Section
              key={`${group.group}-${gi}`}
              title={
                <span className="flex items-center gap-2">
                  <Micro as="span">{group.group || "食材"}</Micro>
                  {groups.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setGroups((list) => list.filter((_, i) => i !== gi))}
                      className="text-[11px] font-medium text-indigo active:opacity-50"
                    >
                      删除分组
                    </button>
                  ) : null}
                </span>
              }
            >
              <div className="u-sep flex min-h-11 items-center gap-3 px-4 py-2.5">
                <span className="w-14 shrink-0 text-body text-ink">分组名</span>
                <TextInput
                  value={group.group}
                  onChange={(v) =>
                    setGroups((list) =>
                      list.map((g, i) => (i === gi ? { ...g, group: v } : g)),
                    )
                  }
                  align="left"
                  placeholder="主料 / 调味"
                />
              </div>
              {group.items.map((item, ii) => (
                <div
                  key={ii}
                  className="u-sep flex min-h-11 items-center gap-2 px-4 py-2"
                  style={{ ["--sep-inset" as string]: "16px" }}
                >
                  <TextInput
                    value={item.name}
                    onChange={(v) => setItem(gi, ii, { name: v })}
                    align="left"
                    placeholder="食材"
                    className="flex-1"
                  />
                  <span className="h-5 w-px bg-hair" aria-hidden />
                  <TextInput
                    value={item.amount}
                    onChange={(v) => setItem(gi, ii, { amount: v })}
                    align="right"
                    placeholder="用量"
                    className="w-24 shrink-0 text-muted"
                  />
                  <IconButton
                    label="删除该食材"
                    size="sm"
                    variant="fill"
                    onClick={() =>
                      setGroups((list) =>
                        list.map((g, i) =>
                          i === gi ? { ...g, items: g.items.filter((_, j) => j !== ii) } : g,
                        ),
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setGroups((list) =>
                    list.map((g, i) =>
                      i === gi ? { ...g, items: [...g.items, { name: "", amount: "" }] } : g,
                    ),
                  )
                }
                className="u-press flex min-h-11 w-full items-center gap-2 px-4 py-3 text-[15px] text-indigo"
              >
                <Plus size={16} strokeWidth={2.4} />
                添加食材
              </button>
            </Section>
          ))}

          <button
            type="button"
            onClick={() =>
              setGroups((list) => [
                ...list,
                { group: list.length === 1 ? "调味" : `分组 ${list.length + 1}`, items: [{ name: "", amount: "" }] },
              ])
            }
            className="-mt-3 self-start px-4 text-[15px] text-indigo active:opacity-50"
          >
            + 添加食材分组
          </button>
        </div>

        <Section title="步骤" footer="每行一步，详情页会自动编号">
          {steps.map((step, i) => (
            <div
              key={i}
              className="u-sep flex items-start gap-3 px-4 py-2.5"
              style={{ ["--sep-inset" as string]: "44px" }}
            >
              <span className="u-num mt-1.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-fill text-[12px] font-bold text-ink-soft">
                {i + 1}
              </span>
              <TextArea
                value={step}
                onChange={(v) => setSteps((list) => list.map((s, j) => (j === i ? v : s)))}
                rows={step.length > 34 ? 2 : 1}
                placeholder="这一步做什么？"
              />
              {steps.length > 1 ? (
                <IconButton
                  label={`删除第 ${i + 1} 步`}
                  size="sm"
                  variant="fill"
                  className="mt-1"
                  onClick={() => setSteps((list) => list.filter((_, j) => j !== i))}
                >
                  <Trash2 size={14} />
                </IconButton>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSteps((list) => [...list, ""])}
            className="u-press flex min-h-11 w-full items-center gap-2 px-4 py-3 text-[15px] text-indigo"
          >
            <Plus size={16} strokeWidth={2.4} />
            添加步骤
          </button>
        </Section>

        {mode === "edit" ? (
          <Section>
            <ListRow
              leading={
                <span className="flex h-[22px] w-[22px] items-center justify-center text-danger">
                  <Trash2 size={17} />
                </span>
              }
              title="删除这道菜谱"
              destructive
              onClick={() => setConfirmDelete(true)}
            />
          </Section>
        ) : (
          <Caption className="px-4 text-center">
            点右上角「完成」保存，之后仍可随时修改
          </Caption>
        )}

        {mode === "edit" && recipe ? (
          <div className="px-4">
            <Caption>
              创建于收藏 {recipe.favorite ? "已开启" : "未开启"} · 累计制作 {recipe.cooked} 次
            </Caption>
          </div>
        ) : null}

        <span className="sr-only">
          <Checkmark on={false} />
        </span>
      </div>

      <Alert
        open={confirmDelete}
        title="删除这道菜谱？"
        message={`「${recipe?.title ?? ""}」将从菜谱库中移除，历史打卡记录会保留。`}
        confirmLabel="删除"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </div>
  );
}
