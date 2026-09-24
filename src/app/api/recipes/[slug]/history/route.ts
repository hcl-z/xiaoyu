import { NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { checkins, recipes } from "@/db/schema";
import { getAppUser } from "@/lib/app-user";

export const dynamic = "force-dynamic";

/**
 * 某道菜谱的打卡历史：详情页用来展示「做过的记录」与「历次笔记」。
 * 已实做的按日期倒序，计划中的单独一组按日期正序。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getAppUser();
  const { slug } = await params;

  try {
    const [recipe] = await db
      .select({ slug: recipes.slug, cooked: recipes.cooked, lastCookedOn: recipes.lastCookedOn })
      .from(recipes)
      .where(and(eq(recipes.userId, user.id), eq(recipes.slug, slug)))
      .limit(1);
    if (!recipe) return NextResponse.json({ error: "recipe not found" }, { status: 404 });

    const rows = await db
      .select()
      .from(checkins)
      .where(and(eq(checkins.userId, user.id), eq(checkins.recipeSlug, slug)))
      .orderBy(desc(checkins.day), asc(checkins.time))
      .limit(60);

    return NextResponse.json({
      slug,
      cooked: recipe.cooked,
      lastCookedOn: recipe.lastCookedOn,
      history: rows.filter((r) => !r.planned),
      planned: rows.filter((r) => r.planned).sort((a, b) => a.day.localeCompare(b.day)),
    });
  } catch (error) {
    console.error("GET /api/recipes/[slug]/history failed", error);
    return NextResponse.json({ error: "读取历史失败" }, { status: 500 });
  }
}
