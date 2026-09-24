"use client";

/**
 * 打卡照片的客户端预处理。
 *
 * 手机直出照片常在 4MB 以上，原样上传会卡住弱网用户，也会让 bytea 表迅速膨胀。
 * 所以先在 canvas 里等比缩到长边 1600px 再以 JPEG 0.8 重编码，
 * 通常能压到 200–400KB，作为打卡配图足够清晰。
 */

const MAX_EDGE = 1600;
const QUALITY = 0.8;

export type PreparedPhoto = {
  file: File;
  /** 本地预览地址；用完必须 revoke */
  previewUrl: string;
  width: number;
  height: number;
};

/** 读成可绘制的位图，优先用 createImageBitmap（省内存且不需要挂 DOM） */
async function decode(file: File): Promise<{ bitmap: ImageBitmap | HTMLImageElement; w: number; h: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { bitmap, w: bitmap.width, h: bitmap.height };
    } catch {
      // Safari 对部分 HEIC/渐进式 JPEG 会抛错，落回 <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("图片解码失败"));
      el.src = url;
    });
    return { bitmap: img, w: img.naturalWidth, h: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * 压缩并生成预览。压缩失败时退回原文件——宁可传大图，
 * 也不要因为浏览器差异让用户完全无法打卡。
 */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  try {
    const { bitmap, w, h } = await decode(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
    const width = Math.max(1, Math.round(w * scale));
    const height = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 不可用");
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
    if ("close" in bitmap) bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob) throw new Error("编码失败");

    const compressed = new File([blob], "checkin.jpg", { type: "image/jpeg" });
    return {
      file: compressed,
      previewUrl: URL.createObjectURL(compressed),
      width,
      height,
    };
  } catch {
    return {
      file,
      previewUrl: URL.createObjectURL(file),
      width: 0,
      height: 0,
    };
  }
}

/** 上传一张已压缩的照片，返回 photoId */
export async function uploadPhoto(photo: PreparedPhoto): Promise<number> {
  const body = new FormData();
  body.append("file", photo.file);
  body.append("width", String(photo.width));
  body.append("height", String(photo.height));

  const res = await fetch("/api/photos", { method: "POST", body });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.photo?.id) {
    throw new Error(data?.error ?? "上传失败");
  }
  return data.photo.id as number;
}
