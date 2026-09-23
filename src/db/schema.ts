import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

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
    cooked: integer("cooked").notNull().default(0),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("checkins_user_day_idx").on(t.userId, t.day)],
);
