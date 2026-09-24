import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

// 与运行时保持一致：.env.local 优先，其次 .env
loadEnv({ path: ".env.local" });
loadEnv();

/**
 * 连接信息只从 DATABASE_URL 读，不在仓库里硬编码。
 * 缺失时立刻报错，避免静默 push 到一个不存在或不相干的库。
 */
const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is required for drizzle-kit. Set it in .env.local, e.g.\n" +
      "  DATABASE_URL=postgresql://<user>@127.0.0.1:5432/app_db",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url },
});
