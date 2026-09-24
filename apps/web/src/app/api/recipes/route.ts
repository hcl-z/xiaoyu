import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { getAppUser } from "@/lib/app-user";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;
type Ingredients = { group: string; items: { name: string; amount: string }[] }[];

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "recipe"}-${Date.now().toString(36)}`;
}

async function readBody(request: Request): Promise<Body | null> {
  const body = await request.json().catch(() => null);
  return body && typeof body === "object" ? (body as Body) : null;
}

/**
 * 只接受白名单字段；归属账号永远以服务端解析的当前用户为准。
 * cooked / lastCookedOn 不在其中：它们由打卡记录派生，见 lib/recipe-stats.ts。
 */
function readFields(body: Body) {
  return {
    subtitle: typeof body.subtitle === "string" ? body.subtitle : "",
    category:
      typeof body.category === "string" && body.category ? body.category : "主食",
    minutes: Math.max(1, Number(body.minutes) || 20),
    servings: Math.max(1, Number(body.servings) || 2),
    image: typeof body.image === "string" ? body.image : "",
    favorite: Boolean(body.favorite),
    tags: Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === "string")
      : [],
    ingredients: Array.isArray(body.ingredients) ? (body.ingredients as Ingredients) : [],
    steps: Array.isArray(body.steps)
      ? body.steps.filter((s): s is string => typeof s === "string")
      : [],
  };
}

export async function GET() {
  const user = await getAppUser();
  try {
    const rows = await db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, user.id))
      .orderBy(recipes.id);
    return NextResponse.json({ recipes: rows });
  } catch (error) {
    console.error("GET /api/recipes failed", error);
    return NextResponse.json({ error: "读取菜谱失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAppUser();
  const body = await readBody(request);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!body || !title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  try {
    let slug = typeof body.slug === "string" && body.slug ? body.slug : slugify(title);
    const [taken] = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(and(eq(recipes.userId, user.id), eq(recipes.slug, slug)))
      .limit(1);
    if (taken) slug = slugify(title);

    const [recipe] = await db
      .insert(recipes)
      .values({ ...readFields(body), userId: user.id, slug, title })
      .returning();
    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) {
    console.error("POST /api/recipes failed", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getAppUser();
  const slug = new URL(request.url).searchParams.get("slug");
  const body = await readBody(request);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!slug || !body || !title) {
    return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
  }
  try {
    const [recipe] = await db
      .update(recipes)
      .set({ ...readFields(body), title })
      .where(and(eq(recipes.userId, user.id), eq(recipes.slug, slug)))
      .returning();
    if (!recipe) return NextResponse.json({ error: "recipe not found" }, { status: 404 });
    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("PATCH /api/recipes failed", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAppUser();
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });
  try {
    const deleted = await db
      .delete(recipes)
      .where(and(eq(recipes.userId, user.id), eq(recipes.slug, slug)))
      .returning({ id: recipes.id });
    return NextResponse.json({ ok: deleted.length > 0 });
  } catch (error) {
    console.error("DELETE /api/recipes failed", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
