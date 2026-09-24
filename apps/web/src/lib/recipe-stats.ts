import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { checkins, recipes } from "@/db/schema";

/**
 * 把「做过几次 / 上次做于」重新算一遍，而不是做 +1 累加。
 *
 * 打卡是唯一的事实来源：新增、改名、删除、把计划转成实做，全都只要调用这里，
 * 菜谱上的计数就不会和历史记录对不上。计划中的记录（planned）不算做过。
 */
export async function syncRecipeCookStats(userId: number, slugs: (string | null | undefined)[]) {
  const unique = [...new Set(slugs.filter((s): s is string => Boolean(s)))];
  if (unique.length === 0) return;

  await Promise.all(
    unique.map(async (slug) => {
      const [agg] = await db
        .select({
          total: sql<number>`count(*)::int`,
          last: sql<string | null>`max(${checkins.day})`,
        })
        .from(checkins)
        .where(
          and(
            eq(checkins.userId, userId),
            eq(checkins.recipeSlug, slug),
            eq(checkins.planned, false),
          ),
        );

      await db
        .update(recipes)
        .set({ cooked: agg?.total ?? 0, lastCookedOn: agg?.last ?? null })
        .where(and(eq(recipes.userId, userId), eq(recipes.slug, slug)));
    }),
  );
}

/** 一次性对齐某个账号的全部菜谱计数，用于修复历史数据 */
export async function resyncAllRecipeCookStats(userId: number) {
  const rows = await db
    .selectDistinct({ slug: checkins.recipeSlug })
    .from(checkins)
    .where(and(eq(checkins.userId, userId), isNotNull(checkins.recipeSlug)));
  await syncRecipeCookStats(
    userId,
    rows.map((r) => r.slug),
  );
}
