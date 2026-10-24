/**
 * daily + · 照片（Supabase Storage）
 * ------------------------------------------------------------------
 * 桶 checkin-photos 公开读：App 直接用公共 URL 显示；
 * 写删策略只放行本人目录（路径首段 = auth.uid()）。
 * 菜谱封面与打卡照片同桶，封面放在 uid/covers/ 子目录。
 */
import { supabase } from './supabase';

export const PHOTO_BUCKET = 'checkin-photos';

/** 内置的种子封面：App 包里的 PNG，不走网络 */
const SEED_COVERS: Record<string, number> = {
  braised_beef: require('../../assets/covers/recipe-braised-beef.png'),
  salmon: require('../../assets/covers/recipe-salmon.png'),
  spinach: require('../../assets/covers/recipe-spinach.png'),
  pasta: require('../../assets/covers/recipe-pasta.png'),
  egg: require('../../assets/covers/recipe-egg.png'),
  yogurt: require('../../assets/covers/recipe-yogurt.png'),
};

/**
 * 界面显示用的图源：seed: 前缀 → 本地资源；Storage 路径 → 公共 URL；
 * 空值 → null（调用方走占位）。
 */
export function imageSource(path: string | null | undefined): { uri: string } | number | null {
  if (!path) return null;
  if (path.startsWith('seed:')) return SEED_COVERS[path.slice(5)] ?? null;
  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return { uri: data.publicUrl };
}

/** 上传一张图片到本人目录，返回 Storage 路径 */
export async function uploadImage(
  bytes: Uint8Array,
  folder: 'checkins' | 'covers',
  fileName: string
): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData.session?.user.id;
  if (!uid) throw new Error('登录状态失效，请重新登录后再试');

  const path = `${uid}/${folder}/${fileName}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

/** 删除 Storage 里的对象（删记录时顺手清图，失败不打断） */
export async function removeImage(path: string): Promise<void> {
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}
