import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { getAppUser } from "@/lib/app-user";

export const dynamic = "force-dynamic";

/** 客户端已压到长边 1600 / JPEG 0.8；这里只兜底拦住异常大的请求 */
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/** 上传一张打卡照片，返回 id 供 checkin 引用 */
export async function POST(request: Request) {
  const user = await getAppUser();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "需要 multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少图片" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "只支持 JPEG / PNG / WebP" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "图片过大，请重试" }, { status: 413 });
  }

  const width = Number(form.get("width")) || 0;
  const height = Number(form.get("height")) || 0;

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const [photo] = await db
      .insert(photos)
      .values({ userId: user.id, mime: file.type, width, height, bytes })
      .returning({ id: photos.id, width: photos.width, height: photos.height });
    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    console.error("POST /api/photos failed", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}

/** 删除一张照片（仅限本人）；引用它的 checkin 会被置空 */
export async function DELETE(request: Request) {
  const user = await getAppUser();
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  try {
    const deleted = await db
      .delete(photos)
      .where(and(eq(photos.id, id), eq(photos.userId, user.id)))
      .returning({ id: photos.id });
    return NextResponse.json({ ok: deleted.length > 0 });
  } catch (error) {
    console.error("DELETE /api/photos failed", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
