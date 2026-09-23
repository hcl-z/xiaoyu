import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { checkins } from "@/db/schema";
import { getAppUser } from "@/lib/app-user";
import { todayISO } from "@/lib/content";

export const dynamic = "force-dynamic";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const user = await getAppUser();
  const requested = new URL(request.url).searchParams.get("day");
  const day = requested && DAY_RE.test(requested) ? requested : todayISO();
  try {
    const rows = await db
      .select()
      .from(checkins)
      .where(and(eq(checkins.userId, user.id), eq(checkins.day, day)))
      .orderBy(asc(checkins.time), asc(checkins.id));
    return NextResponse.json({ day, checkins: rows });
  } catch (error) {
    console.error("GET /api/checkins failed", error);
    return NextResponse.json({ error: "读取记录失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAppUser();
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!body || typeof body.meal !== "string" || !title) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const record = {
    userId: user.id,
    day: typeof body.day === "string" && DAY_RE.test(body.day) ? body.day : todayISO(),
    meal: body.meal.trim() || "正餐",
    title,
    recipeSlug: typeof body.recipeSlug === "string" ? body.recipeSlug : null,
    portion: typeof body.portion === "string" ? body.portion : "1 份",
    time:
      typeof body.time === "string" && body.time
        ? body.time
        : new Date().toTimeString().slice(0, 5),
  };
  try {
    const [checkin] = await db.insert(checkins).values(record).returning();
    return NextResponse.json({ checkin });
  } catch (error) {
    console.error("POST /api/checkins failed", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAppUser();
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  try {
    // 只能删除自己的记录
    const deleted = await db
      .delete(checkins)
      .where(and(eq(checkins.id, id), eq(checkins.userId, user.id)))
      .returning({ id: checkins.id });
    return NextResponse.json({ ok: deleted.length > 0 });
  } catch (error) {
    console.error("DELETE /api/checkins failed", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
