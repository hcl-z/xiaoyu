import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { checkins, recipes, taxonomies, users } from "@/db/schema";
import { hashPassword, type SessionUser } from "@/lib/auth";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_TAGS,
  DEMO_EMAIL,
  DEMO_NAME,
  RECIPES,
  SEED_CHECKINS,
  SEED_HISTORY_CHECKINS,
  SEED_PLANNED_CHECKINS,
  dayOffsetISO,
  todayISO,
} from "@/lib/content";

/**
 * 新账号的起步内容：6 道入门菜谱 + 分类 / 标签库。
 * 普通账号的「做过几次」与收藏从 0 开始，不预置任何假数据；打卡记录为空。
 */
export async function seedStarterContent(userId: number, opts: { demo?: boolean } = {}) {
  const demo = Boolean(opts.demo);

  /** 演示账号的「上次做于」由种子打卡倒推，保证与历史记录一致 */
  const lastCookedBySlug = new Map<string, string>();
  if (demo) {
    for (const c of SEED_CHECKINS) {
      if (c.recipeSlug) lastCookedBySlug.set(c.recipeSlug, todayISO());
    }
    for (const c of SEED_HISTORY_CHECKINS) {
      if (!c.recipeSlug) continue;
      const day = dayOffsetISO(c.daysAgo);
      const known = lastCookedBySlug.get(c.recipeSlug);
      if (!known || day > known) lastCookedBySlug.set(c.recipeSlug, day);
    }
  }

  await db.insert(recipes).values(
    RECIPES.map((r) => ({
      ...r,
      userId,
      cooked: demo ? r.cooked : 0,
      favorite: demo ? r.favorite : false,
      lastCookedOn: demo ? (lastCookedBySlug.get(r.slug) ?? null) : null,
    })),
  );

  const categories = new Set<string>(DEFAULT_CATEGORIES);
  const tags = new Set<string>(DEFAULT_TAGS);
  for (const r of RECIPES) {
    categories.add(r.category);
    r.tags.forEach((t) => tags.add(t));
  }
  await db.insert(taxonomies).values([
    ...[...categories].map((name, i) => ({ userId, kind: "category", name, sortOrder: i })),
    ...[...tags].map((name, i) => ({ userId, kind: "tag", name, sortOrder: i })),
  ]);

  if (demo) {
    await db.insert(checkins).values([
      ...SEED_CHECKINS.map((c) => ({ ...c, userId, day: todayISO() })),
      ...SEED_HISTORY_CHECKINS.map(({ daysAgo, ...c }) => ({
        ...c,
        userId,
        day: dayOffsetISO(daysAgo),
      })),
      ...SEED_PLANNED_CHECKINS.map(({ daysAhead, ...c }) => ({
        ...c,
        userId,
        day: dayOffsetISO(-daysAhead),
        planned: true,
      })),
    ]);
  }
}

/** 公共演示账号：不存在时自动创建并填充示例数据；密码随机，仅作访客体验，不用于私人账号登录 */
export async function ensureDemoUser(): Promise<SessionUser> {
  const find = () =>
    db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.email, DEMO_EMAIL))
      .limit(1);

  const [existing] = await find();
  if (existing) return existing;

  const passwordHash = await hashPassword(randomBytes(24).toString("base64url"));
  const [created] = await db
    .insert(users)
    .values({ email: DEMO_EMAIL, name: DEMO_NAME, passwordHash })
    .onConflictDoNothing()
    .returning({ id: users.id, email: users.email, name: users.name });

  if (!created) {
    const [again] = await find();
    if (!again) throw new Error("demo user unavailable");
    return again;
  }

  await seedStarterContent(created.id, { demo: true });
  return created;
}
