"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  Alert,
  Button,
  Caption,
  ListRow,
  NavBar,
  Section,
  Sheet,
  Skeleton,
  TextInput,
} from "@/components/ds";
import { layout } from "@/design/tokens";
import {
  useTaxonomies,
  type TaxonomyItem,
  type TaxonomyKind,
} from "@/lib/use-app-data";

type Copy = {
  title: string;
  label: string;
  emptyDesc: string;
  note: string;
  placeholder: string;
};

const COPY: Record<TaxonomyKind, Copy> = {
  category: {
    title: "分类管理",
    label: "分类",
    emptyDesc: "还没有分类。分类用于菜谱库顶部的筛选，在下方输入即可创建。",
    note: "重命名会同步更新所有属于该分类的菜谱；仍被菜谱使用的分类无法删除，先把菜谱改到其它分类。",
    placeholder: "输入分类名，回车即添加",
  },
  tag: {
    title: "标签管理",
    label: "标签",
    emptyDesc: "还没有标签。标签用来标记做法与场景，在下方输入即可创建。",
    note: "重命名会同步更新所有带该标签的菜谱；删除标签只会把它从菜谱上摘掉，菜谱本身保留。",
    placeholder: "输入标签名，回车即添加",
  },
};

/** 与 ds/TextInput 完全一致的输入样式，便于在需要键盘事件时就地复用 */
const INPUT_CLS =
  "w-full min-w-0 bg-transparent text-body text-ink outline-none placeholder:text-muted/70";

function usageLabel(item: TaxonomyItem) {
  return item.count > 0 ? `正被 ${item.count} 道菜谱使用` : "当前没有菜谱使用";
}

export function TaxonomyManager({ kind }: { kind: TaxonomyKind }) {
  const router = useRouter();
  const { categories, tags, loading, addTaxonomy, renameTaxonomy, removeTaxonomy } =
    useTaxonomies();

  const copy = COPY[kind];
  const items = kind === "category" ? categories : tags;

  /* 就地新增：常驻输入行，回车即建，建完保持聚焦可连续添加 */
  const composerRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  /* 弹层只负责编辑（重命名 / 删除） */
  const [editing, setEditing] = useState<TaxonomyItem | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const usedCount = useMemo(() => items.filter((i) => i.count > 0).length, [items]);

  const focusComposer = () => {
    composerRef.current?.focus();
    composerRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const commitAdd = async () => {
    const value = draft.trim();
    if (!value || adding) return;
    if (items.some((i) => i.name === value)) {
      setAddError(`「${value}」已存在`);
      return;
    }
    setAdding(true);
    setAddError("");
    const res = await addTaxonomy(kind, value);
    setAdding(false);
    if (res.ok) {
      setDraft("");
      composerRef.current?.focus();
    } else {
      setAddError(res.error ?? "添加失败");
    }
  };

  const openEdit = (item: TaxonomyItem) => {
    setEditing(item);
    setName(item.name);
    setError("");
    setSaving(false);
  };

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && trimmedName !== editing?.name && !saving;

  const save = async () => {
    if (!editing || !canSave) return;
    setSaving(true);
    setError("");
    const res = await renameTaxonomy(editing.id, trimmedName);
    setSaving(false);
    if (res.ok) setEditing(null);
    else setError(res.error ?? "保存失败");
  };

  const remove = async () => {
    if (!editing) return;
    setConfirmDelete(false);
    setSaving(true);
    setError("");
    const res = await removeTaxonomy(editing.id);
    setSaving(false);
    if (res.ok) setEditing(null);
    else setError(res.error ?? "删除失败");
  };

  return (
    <div className="pb-10">
      <NavBar
        variant="compact"
        title={copy.title}
        onBack={() => router.push("/profile")}
        backLabel="我的"
        trailing={
          <button
            type="button"
            onClick={focusComposer}
            className="px-2 py-1 text-[15px] font-semibold text-indigo active:opacity-50"
          >
            添加
          </button>
        }
      />

      <div className="flex flex-col gap-6 px-5 pt-5">
        <Section
          title={`全部${copy.label}`}
          footer={
            !loading && items.length > 0
              ? `共 ${items.length} 个 · ${usedCount} 个正在使用`
              : undefined
          }
        >
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="u-sep flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                  <Skeleton className="h-3 w-10" />
                </div>
              ))}
            </>
          ) : (
            <>
              {items.length === 0 ? (
                <div
                  className="u-sep px-4 py-6 text-center"
                  style={{ ["--sep-inset" as string]: "0px" }}
                >
                  <Caption className="block leading-relaxed">{copy.emptyDesc}</Caption>
                </div>
              ) : (
                items.map((item) => (
                  <ListRow
                    key={item.id}
                    ariaLabel={`编辑${copy.label} ${item.name}`}
                    title={item.name}
                    value={item.count > 0 ? `${item.count} 道` : "未使用"}
                    accessory="chevron"
                    onClick={() => openEdit(item)}
                  />
                ))
              )}

              {/* 就地新增行：无需弹层，输入后回车即创建 */}
              <div
                className="u-sep flex min-h-11 items-center gap-3 px-4 py-2.5"
                style={{ ["--sep-inset" as string]: "0px" }}
              >
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-tint text-indigo">
                  <Plus size={14} strokeWidth={2.6} />
                </span>
                <input
                  ref={composerRef}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (addError) setAddError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void commitAdd();
                    }
                  }}
                  placeholder={copy.placeholder}
                  aria-label={`新增${copy.label}`}
                  className={INPUT_CLS}
                />
                {draft.trim() ? (
                  <button
                    type="button"
                    onClick={() => void commitAdd()}
                    disabled={adding}
                    className="shrink-0 text-[15px] font-semibold text-indigo active:opacity-50 disabled:text-muted/40"
                  >
                    {adding ? "添加中" : "添加"}
                  </button>
                ) : null}
              </div>
            </>
          )}
        </Section>

        {addError ? (
          <Caption tone="danger" className="-mt-4 block px-1 leading-relaxed">
            {addError}
          </Caption>
        ) : null}

        <Section padded>
          <Caption className="block leading-relaxed">{copy.note}</Caption>
        </Section>
      </div>

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={`编辑${copy.label}`}
        subtitle={editing ? usageLabel(editing) : undefined}
        action={{ label: "保存", onClick: save, disabled: !canSave }}
        footer={
          <Button size="lg" block disabled={!canSave} onClick={save}>
            {saving ? "保存中…" : "保存修改"}
          </Button>
        }
      >
        <div className="space-y-5 pb-2">
          <Section tone="deep">
            <div className="flex min-h-11 items-center gap-3 px-4 py-2.5">
              <span className="w-14 shrink-0 text-body text-muted">名称</span>
              <TextInput
                value={name}
                onChange={(v) => {
                  setName(v);
                  if (error) setError("");
                }}
                align="left"
                autoFocus
                placeholder={`${copy.label}名称`}
              />
            </div>
          </Section>

          {error ? (
            <Caption tone="danger" className="block px-1 leading-relaxed">
              {error}
            </Caption>
          ) : null}

          <Section tone="deep">
            <ListRow
              leading={
                <span className="flex h-[22px] w-[22px] items-center justify-center text-danger">
                  <Trash2 size={17} />
                </span>
              }
              title={`删除${copy.label}`}
              destructive
              onClick={() => setConfirmDelete(true)}
            />
          </Section>
        </div>
      </Sheet>

      <Alert
        open={confirmDelete}
        title={`删除「${editing?.name ?? ""}」？`}
        message={
          kind === "category"
            ? "仅当没有菜谱属于该分类时才能删除。"
            : `该标签会从 ${editing?.count ?? 0} 道菜谱上移除，菜谱本身保留。`
        }
        confirmLabel="删除"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />

      <div style={{ height: layout.safeBottom }} aria-hidden />
    </div>
  );
}
