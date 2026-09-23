import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { recipes, taxonomies } from "@/db/schema";
import { getAppUser } from "@/lib/app-user";

export const dynamic = "force-dynamic";

type TaxonomyKind = "category" | "tag";
type TaxonomyItem = { id: number; name: string; count: number };

const MAX_NAME = 12;
const isKind = (v: unknown): v is TaxonomyKind => v === "category" || v === "tag";
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** 统计每个分类 / 标签被当前账号的多少道菜谱使用 */
async function withCounts(userId: number) {
  const [rows, recipeRows] = await Promise.all([
    db
      .select()
      .from(taxonomies)
      .where(eq(taxonomies.userId, userId))
      .orderBy(asc(taxonomies.sortOrder), asc(taxonomies.id)),
    db
      .select({ category: recipes.category, tags: recipes.tags })
      .from(recipes)
      .where(eq(recipes.userId, userId)),
  ]);

  const catCount = new Map<string, number>();
  const tagCount = new Map<string, number>();
  for (const r of recipeRows) {
    if (r.category) catCount.set(r.category, (catCount.get(r.category) ?? 0) + 1);
    for (const t of r.tags ?? []) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  }

  const pick = (kind: TaxonomyKind): TaxonomyItem[] =>
    rows
      .filter((r) => r.kind === kind)
      .map((r) => ({
        id: r.id,
        name: r.name,
        count: (kind === "category" ? catCount : tagCount).get(r.name) ?? 0,
      }));

  return { categories: pick("category"), tags: pick("tag") };
}

async function findOwned(userId: number, id: number) {
  const [row] = await db
    .select()
    .from(taxonomies)
    .where(and(eq(taxonomies.id, id), eq(taxonomies.userId, userId)))
    .limit(1);
  return row;
}

async function nameTaken(userId: number, kind: string, name: string) {
  const [row] = await db
    .select({ id: taxonomies.id })
    .from(taxonomies)
    .where(
      and(eq(taxonomies.userId, userId), eq(taxonomies.kind, kind), eq(taxonomies.name, name)),
    )
    .limit(1);
  return Boolean(row);
}

export async function GET() {
  const user = await getAppUser();
  try {
    return NextResponse.json(await withCounts(user.id));
  } catch (error) {
    console.error("GET /api/taxonomies failed", error);
    return fail("读取失败", 500);
  }
}

export async function POST(request: Request) {
  const user = await getAppUser();
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const kind = body?.kind;
  if (!isKind(kind) || !name) return fail("kind 与 name 必填");
  if (name.length > MAX_NAME) return fail(`名称请控制在 ${MAX_NAME} 字以内`);
  try {
    if (await nameTaken(user.id, kind, name)) return fail("已存在同名条目", 409);
    const siblings = await db
      .select({ id: taxonomies.id })
      .from(taxonomies)
      .where(and(eq(taxonomies.userId, user.id), eq(taxonomies.kind, kind)));
    await db
      .insert(taxonomies)
      .values({ userId: user.id, kind, name, sortOrder: siblings.length });
    return NextResponse.json(await withCounts(user.id), { status: 201 });
  } catch (error) {
    console.error("POST /api/taxonomies failed", error);
    return fail("保存失败", 500);
  }
}

/** 重命名，并把改动同步到当前账号所有引用它的菜谱 */
export async function PATCH(request: Request) {
  const user = await getAppUser();
  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!Number.isFinite(id) || !name) return fail("id 与 name 必填");
  if (name.length > MAX_NAME) return fail(`名称请控制在 ${MAX_NAME} 字以内`);
  try {
    const target = await findOwned(user.id, id);
    if (!target) return fail("条目不存在", 404);
    if (target.name === name) return NextResponse.json(await withCounts(user.id));
    if (await nameTaken(user.id, target.kind, name)) return fail("已存在同名条目", 409);

    await db.update(taxonomies).set({ name }).where(eq(taxonomies.id, target.id));

    if (target.kind === "category") {
      await db
        .update(recipes)
        .set({ category: name })
        .where(and(eq(recipes.userId, user.id), eq(recipes.category, target.name)));
    } else {
      const owned = await db
        .select({ id: recipes.id, tags: recipes.tags })
        .from(recipes)
        .where(eq(recipes.userId, user.id));
      for (const r of owned) {
        if ((r.tags ?? []).includes(target.name)) {
          await db
            .update(recipes)
            .set({ tags: (r.tags ?? []).map((t) => (t === target.name ? name : t)) })
            .where(eq(recipes.id, r.id));
        }
      }
    }
    return NextResponse.json(await withCounts(user.id));
  } catch (error) {
    console.error("PATCH /api/taxonomies failed", error);
    return fail("保存失败", 500);
  }
}

export async function DELETE(request: Request) {
  const user = await getAppUser();
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return fail("invalid id");
  try {
    const target = await findOwned(user.id, id);
    if (!target) return fail("条目不存在", 404);

    if (target.kind === "category") {
      // 每道菜谱必须归属一个分类，占用中的分类不允许直接删除
      const used = await db
        .select({ id: recipes.id })
        .from(recipes)
        .where(and(eq(recipes.userId, user.id), eq(recipes.category, target.name)));
      if (used.length > 0) {
        return NextResponse.json(
          { error: `仍有 ${used.length} 道菜谱属于「${target.name}」`, inUse: used.length },
          { status: 409 },
        );
      }
    } else {
      // 标签可直接删除，同时从当前账号的菜谱上摘掉
      const owned = await db
        .select({ id: recipes.id, tags: recipes.tags })
        .from(recipes)
        .where(eq(recipes.userId, user.id));
      for (const r of owned) {
        if ((r.tags ?? []).includes(target.name)) {
          await db
            .update(recipes)
            .set({ tags: (r.tags ?? []).filter((t) => t !== target.name) })
            .where(eq(recipes.id, r.id));
        }
      }
    }

    await db.delete(taxonomies).where(eq(taxonomies.id, target.id));
    return NextResponse.json(await withCounts(user.id));
  } catch (error) {
    console.error("DELETE /api/taxonomies failed", error);
    return fail("删除失败", 500);
  }
}
