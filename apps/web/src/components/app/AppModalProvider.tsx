"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { RecipeEditor } from "@/components/app/RecipeEditor";
import { TaxonomyManager } from "@/components/app/TaxonomyManager";
import { useRecipes, type TaxonomyKind } from "@/lib/use-app-data";

type EditorState = { mode: "new" } | { mode: "edit"; slug: string } | null;

type ModalCtx = {
  /** 新建菜谱：全屏弹窗打开，不离开当前页 */
  openNewRecipe: () => void;
  /** 编辑已有菜谱 */
  openEditRecipe: (slug: string) => void;
  /** 分类 / 标签管理 */
  openTaxonomy: (kind: TaxonomyKind) => void;
};

const Ctx = createContext<ModalCtx | null>(null);

export function useAppModals(): ModalCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppModals must be used within AppModalProvider");
  return ctx;
}

/** 兼容旧引用 */
export const useRecipeEditor = useAppModals;

/**
 * 全屏弹窗宿主。
 *
 * 这里承载的都是「要么完成要么放弃」的自成体系任务：新建 / 编辑菜谱、
 * 分类与标签管理。用弹窗而不是路由，取消后能原地回到刚才在看的位置，
 * 不产生一层返回栈。对应的路由页仍然保留，供直接访问与展示台使用。
 */
export function AppModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { recipes } = useRecipes();
  const [editor, setEditor] = useState<EditorState>(null);
  const [taxonomy, setTaxonomy] = useState<TaxonomyKind | null>(null);

  const openNewRecipe = useCallback(() => setEditor({ mode: "new" }), []);
  const openEditRecipe = useCallback(
    (slug: string) => setEditor({ mode: "edit", slug }),
    [],
  );
  const openTaxonomy = useCallback((kind: TaxonomyKind) => setTaxonomy(kind), []);

  const editing =
    editor?.mode === "edit" ? recipes.find((r) => r.slug === editor.slug) : undefined;

  /** 编辑目标已不在（被删除）时不要卡住弹窗 */
  const editorOpen = editor !== null && (editor.mode === "new" || Boolean(editing));

  const closeEditor = useCallback(
    (savedSlug: string | null) => {
      const wasNew = editor?.mode === "new";
      setEditor(null);
      // 新建成功后送用户去看刚建好的那道菜；编辑后原地留在详情即可
      if (savedSlug && wasNew) router.push(`/recipes/${savedSlug}`);
    },
    [router, editor],
  );

  const value = useMemo(
    () => ({ openNewRecipe, openEditRecipe, openTaxonomy }),
    [openNewRecipe, openEditRecipe, openTaxonomy],
  );

  return (
    <Ctx.Provider value={value}>
      {children}

      {editor ? (
        <RecipeEditor
          // 换目标时重建表单状态，避免把上一道菜的草稿带过来
          key={editor.mode === "edit" ? editor.slug : "new"}
          mode={editor.mode}
          recipe={editing}
          presentation="modal"
          open={editorOpen}
          onClose={closeEditor}
        />
      ) : null}

      {taxonomy ? (
        <TaxonomyManager
          key={taxonomy}
          kind={taxonomy}
          presentation="modal"
          open
          onClose={() => setTaxonomy(null)}
        />
      ) : null}
    </Ctx.Provider>
  );
}
