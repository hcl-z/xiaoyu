import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { getAppUser } from "@/lib/app-user";

export const dynamic = "force-dynamic";

/**
 * 取一张打卡照片的字节。只能读自己的照片——图片 URL 常被复制转发，
 * 所以这里按会话校验归属，而不是靠 id 不可猜。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAppUser();
  const id = Number((await params).id);
  if (!Number.isFinite(id)) {
    return new Response("invalid id", { status: 400 });
  }

  try {
    const [photo] = await db
      .select({ mime: photos.mime, bytes: photos.bytes })
      .from(photos)
      .where(and(eq(photos.id, id), eq(photos.userId, user.id)))
      .limit(1);

    if (!photo) return new Response("not found", { status: 404 });

    return new Response(new Uint8Array(photo.bytes), {
      headers: {
        "Content-Type": photo.mime,
        "Content-Length": String(photo.bytes.byteLength),
        // 内容按 id 不可变，但归属需校验，故只允许私有缓存
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("GET /api/photos/[id] failed", error);
    return new Response("read failed", { status: 500 });
  }
}
