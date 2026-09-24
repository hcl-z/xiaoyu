import { NextResponse } from "next/server";
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import { checkins, photos } from "@/db/schema";
import { getAppUser } from "@/lib/app-user";
import { todayISO } from "@/lib/content";
import { syncRecipeCookStats } from "@/lib/recipe-stats";

export const dynamic = "force-dynamic";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const NOTE_MAX = 280;

const day = (v: unknown, fallback: string) =>
  typeof v === "string" && DAY_RE.test(v) ? v : fallback;

const note = (v: unknown) =>
  typeof v === "string" ? v.trim().slice(0, NOTE_MAX) : "";

const photoId = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * 两种读法：
 *   ?day=YYYY-MM-DD      单日（默认今天）
 *   ?from=…&to=…         区间，用于「接下来的计划」
 */
export async function GET(request: Request) {
  const user = await getAppUser();
  const sp = new URL(request.url).searchParams;
  const from = sp.get("from");
  const to = sp.get("to");

  try {
    if (from && DAY_RE.test(from) && to && DAY_RE.test(to)) {
      const rows = await db
        .select()
        .from(checkins)
        .where(
          and(eq(checkins.userId, user.id), gte(checkins.day, from), lte(checkins.day, to)),
        )
        .orderBy(asc(checkins.day), asc(checkins.time), asc(checkins.id));
      return NextResponse.json({ from, to, checkins: rows });
    }

    const target = day(sp.get("day"), todayISO());
    const rows = await db
      .select()
      .from(checkins)
      .where(and(eq(checkins.userId, user.id), eq(checkins.day, target)))
      .orderBy(asc(checkins.time), asc(checkins.id));
    return NextResponse.json({ day: target, checkins: rows });
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
    day: day(body.day, todayISO()),
    meal: body.meal.trim() || "正餐",
    title,
    recipeSlug: typeof body.recipeSlug === "string" ? body.recipeSlug : null,
    portion: typeof body.portion === "string" ? body.portion : "1 份",
    time:
      typeof body.time === "string" && body.time
        ? body.time
        : new Date().toTimeString().slice(0, 5),
    note: note(body.note),
    planned: Boolean(body.planned),
    photoId: photoId(body.photoId),
  };
  try {
    const [checkin] = await db.insert(checkins).values(record).returning();
    await syncRecipeCookStats(user.id, [checkin.recipeSlug]);
    return NextResponse.json({ checkin });
  } catch (error) {
    console.error("POST /api/checkins failed", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

/** 就地修改一条记录：改名、改份量、补笔记，或把计划确认为已吃 */
export async function PATCH(request: Request) {
  const user = await getAppUser();
  const id = Number(new URL(request.url).searchParams.get("id"));
  const body = await request.json().catch(() => null);
  if (!Number.isFinite(id) || !body) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  try {
    const [before] = await db
      .select({ recipeSlug: checkins.recipeSlug })
      .from(checkins)
      .where(and(eq(checkins.id, id), eq(checkins.userId, user.id)))
      .limit(1);
    if (!before) return NextResponse.json({ error: "not found" }, { status: 404 });

    const patch: Partial<typeof checkins.$inferInsert> = {};
    if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim();
    if (typeof body.meal === "string" && body.meal.trim()) patch.meal = body.meal.trim();
    if (typeof body.portion === "string") patch.portion = body.portion;
    if (typeof body.time === "string") patch.time = body.time;
    if (typeof body.day === "string" && DAY_RE.test(body.day)) patch.day = body.day;
    if (typeof body.note === "string") patch.note = note(body.note);
    if (typeof body.planned === "boolean") patch.planned = body.planned;
    if ("photoId" in body) patch.photoId = photoId(body.photoId);
    if ("recipeSlug" in body) {
      patch.recipeSlug = typeof body.recipeSlug === "string" ? body.recipeSlug : null;
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "nothing to update" }, { status: 400 });
    }

    const [checkin] = await db
      .update(checkins)
      .set(patch)
      .where(and(eq(checkins.id, id), eq(checkins.userId, user.id)))
      .returning();

    // 旧菜谱与新菜谱都要重算，换绑时两边计数才都对
    await syncRecipeCookStats(user.id, [before.recipeSlug, checkin.recipeSlug]);
    return NextResponse.json({ checkin });
  } catch (error) {
    console.error("PATCH /api/checkins failed", error);
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
      .returning({
        id: checkins.id,
        recipeSlug: checkins.recipeSlug,
        photoId: checkins.photoId,
      });

    // 跟随删掉照片，否则 bytea 会变成无人引用的死重量
    const orphans = deleted
      .map((d) => d.photoId)
      .filter((pid): pid is number => pid !== null);
    if (orphans.length > 0) {
      await db
        .delete(photos)
        .where(and(eq(photos.userId, user.id), inArray(photos.id, orphans)));
    }

    await syncRecipeCookStats(user.id, deleted.map((d) => d.recipeSlug));
    return NextResponse.json({ ok: deleted.length > 0 });
  } catch (error) {
    console.error("DELETE /api/checkins failed", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
