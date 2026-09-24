import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Postgres bytea ↔ Node Buffer */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/** 账号：邮箱唯一（统一小写存储），密码只保存 scrypt 哈希 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** 会话：id 为令牌的 SHA-256，即使数据库泄露也无法还原出可用的 Cookie */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const recipes = pgTable(
  "recipes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    category: text("category").notNull().default("主食"),
    minutes: integer("minutes").notNull().default(20),
    servings: integer("servings").notNull().default(2),
    image: text("image").notNull().default(""),
    favorite: boolean("favorite").notNull().default(false),
    /** 累计制作次数：由打卡写入时自动累加，不由用户手填 */
    cooked: integer("cooked").notNull().default(0),
    /** 最近一次做这道菜的日期（YYYY-MM-DD）；未做过为 null */
    lastCookedOn: text("last_cooked_on"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    ingredients: jsonb("ingredients")
      .$type<{ group: string; items: { name: string; amount: string }[] }[]>()
      .notNull()
      .default([]),
    steps: jsonb("steps").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("recipes_user_slug_idx").on(t.userId, t.slug)],
);

/** 分类与标签共用一张表，kind 区分：'category' | 'tag'；按账号隔离 */
export const taxonomies = pgTable(
  "taxonomies",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("taxonomies_user_kind_name_idx").on(t.userId, t.kind, t.name)],
);

/**
 * 打卡照片。原型阶段直接存 bytea：零新增基建，但表会随使用量膨胀。
 * 上线前应改为对象存储，届时只要把 bytes 换成 url 字段。
 * 图片已由客户端压到长边 1600px / JPEG 0.8，不存原图。
 */
export const photos = pgTable(
  "photos",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mime: text("mime").notNull().default("image/jpeg"),
    width: integer("width").notNull().default(0),
    height: integer("height").notNull().default(0),
    bytes: bytea("bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("photos_user_idx").on(t.userId)],
);

export const checkins = pgTable(
  "checkins",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: text("day").notNull(),
    meal: text("meal").notNull(),
    title: text("title").notNull(),
    recipeSlug: text("recipe_slug"),
    portion: text("portion").notNull().default("1 份"),
    time: text("time").notNull().default(""),
    /** 这次做的心得，聚合到菜谱详情成为「历次笔记」 */
    note: text("note").notNull().default(""),
    /** 照片打卡的图；为 null 则是菜谱或手输打卡。两类共用同一张表 */
    photoId: integer("photo_id").references(() => photos.id, { onDelete: "set null" }),
    /** true 表示未来日期的用餐计划，尚未真正吃到；确认后转为 false */
    planned: boolean("planned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("checkins_user_day_idx").on(t.userId, t.day),
    index("checkins_user_recipe_idx").on(t.userId, t.recipeSlug),
  ],
);
