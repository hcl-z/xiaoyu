/**
 * daily + · 照片打卡的客户端预处理
 * ------------------------------------------------------------------
 * Web 用 <input type=file> + canvas 压到长边 1600px / JPEG 0.8；
 * 原生换成系统相册 / 相机 + 图像处理模块，压缩预算保持一致。
 *
 * 与 Web 相同的取舍：压缩失败就退回原图——宁可传大图，
 * 也不要因为设备差异让用户完全无法打卡。
 */
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { apiUpload } from '@/data/client';

const MAX_EDGE = 1600;
const QUALITY = 0.8;

export type PreparedPhoto = {
  uri: string;
  width: number;
  height: number;
  /** 压缩后仍然没算出大小时为 false，界面据此少显示一行元信息 */
  compressed: boolean;
};

export type PhotoSource = 'library' | 'camera';

async function ensurePermission(source: PhotoSource): Promise<void> {
  const result =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!result.granted) {
    throw new Error(source === 'camera' ? '需要相机权限才能拍照' : '需要相册权限才能选图');
  }
}

async function compress(uri: string, width: number, height: number): Promise<PreparedPhoto> {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  try {
    const context = ImageManipulator.manipulate(uri);
    if (scale < 1) context.resize({ width: targetW, height: targetH });
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ compress: QUALITY, format: SaveFormat.JPEG });
    return { uri: saved.uri, width: saved.width, height: saved.height, compressed: true };
  } catch {
    return { uri, width, height, compressed: false };
  }
}

/**
 * 拍一张或选一张，压缩后返回。
 * 用户取消返回 null；权限被拒或读图失败抛出可直接展示的中文错误。
 */
export async function pickPhoto(source: PhotoSource): Promise<PreparedPhoto | null> {
  await ensurePermission(source);

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });

  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!asset?.uri) throw new Error('这张图读不出来，换一张试试');

  return compress(asset.uri, asset.width ?? 0, asset.height ?? 0);
}

/** 上传一张已压缩的照片，返回 photoId */
export async function uploadPhoto(photo: PreparedPhoto): Promise<number> {
  const form = new FormData();
  // React Native 的 FormData 接受 { uri, name, type }；类型定义只认 Blob
  form.append('file', {
    uri: photo.uri,
    name: 'checkin.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  form.append('width', String(photo.width));
  form.append('height', String(photo.height));

  const res = await apiUpload<{ photo?: { id: number } }>('/api/photos', form);
  if (!res.ok) throw new Error(res.error);
  const id = res.data.photo?.id;
  if (!id) throw new Error('上传失败，请重试');
  return id;
}
