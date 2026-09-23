import { NextResponse } from "next/server";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { checkins, recipes } from "@/db/schema";
import { getAppUser } from "@/lib/app-user";
import { dayOffsetISO, todayISO } from "@/lib/content";

export const dynamic = "force-dynamic";

const DAYS = 28;

/** 连续打卡天数：从今天（今天还没记则从昨天）往前数 */
function streakFrom(active: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  if (!active.has(todayISO(cursor))) cursor.setDate(cursor.getDate() - 1);
  for (let i = 0; i < 400; i += 1) {
    if (!active.has(todayISO(cursor))) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function GET() {
  const user = await getAppUser();
  const from = dayOffsetISO(DAYS - 1);
  try {
    const [recent, activeDays, recipeTotals, checkinTotals] = await Promise.all([
      db
        .select({ day: checkins.day, count: sql<number>`count(*)::int` })
        .from(checkins)
        .where(and(eq(checkins.userId, user.id), gte(checkins.day, from)))
        .groupBy(checkins.day),
      db
        .selectDistinct({ day: checkins.day })
        .from(checkins)
        .where(eq(checkins.userId, user.id))
        .orderBy(desc(checkins.day))
        .limit(400),
      db
        .select({
          total: sql<number>`count(*)::int`,
          favorites: sql<number>`count(*) filter (where favorite)::int`,
        })
        .from(recipes)
        .where(eq(recipes.userId, user.id)),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(checkins)
        .where(eq(checkins.userId, user.id)),
    ]);

    const counts = new Map(recent.map((r) => [r.day, r.count]));
    const days = Array.from({ length: DAYS }, (_, i) => {
      const day = dayOffsetISO(DAYS - 1 - i);
      return { day, count: counts.get(day) ?? 0 };
    });

    return NextResponse.json({
      streak: streakFrom(new Set(activeDays.map((d) => d.day))),
      days,
      totals: {
        recipes: recipeTotals[0]?.total ?? 0,
        favorites: recipeTotals[0]?.favorites ?? 0,
        checkins: checkinTotals[0]?.total ?? 0,
        activeDays: days.filter((d) => d.count > 0).length,
      },
    });
  } catch (error) {
    console.error("GET /api/stats failed", error);
    return NextResponse.json({ error: "统计失败" }, { status: 500 });
  }
}
