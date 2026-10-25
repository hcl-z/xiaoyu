/**
 * RemoteImage — 图片的统一入口
 * ------------------------------------------------------------------
 * 网络图一定会失败：Storage 里没有这张图、离线、链接失效。
 * RN 默认什么都不画，列表行里就留一个空洞，卡片上只剩一层渐变。
 * 所以这里把「取不到图」收敛成一个显式状态：失败就换调用方给的占位，
 * 界面形状不塌，也不必每个用到图的地方各写一遍 onError。
 *
 * 底层是 expo-image：内存 + 磁盘双级缓存（回访不再重新下载），
 * 缩略图按目标尺寸降采样解码（48px 的行图不再解码整张 1600px 原图），
 * 自带 120ms 交叉淡入，图到位前透出底色而不是闪一下。
 *
 * src 的取值：Storage 路径（转公共 URL）、本地资源 id、空（占位）。
 */
import { useState, type ReactNode } from 'react';
import { Image } from 'expo-image';
import { View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { imageSource } from '@/data/photos';

export type ImageSrc = string | number | null | undefined;

/**
 * 图到底有没有到位——压在图片上写字的卡片据此切换蒙层与字色。
 * 口径与 RemoteImage 一致：没有图、加载失败，都算「没有图」；
 * 本地内置插画不经过网络，直接算到位。
 */
export function useImageStatus(src: ImageSrc) {
  const resolved: string | null =
    typeof src === 'number'
      ? 'asset'
      : (() => {
          const image = imageSource(src);
          return image && typeof image === 'object' ? image.uri : image === null ? null : 'asset';
        })();
  const [seenUri, setSeenUri] = useState(resolved);
  const [loaded, setLoaded] = useState(resolved != null || typeof src === 'number');
  /** 换了地址要重新判断（React 官方的「props 变化时调整 state」写法） */
  if (seenUri !== resolved) {
    setSeenUri(resolved);
    setLoaded(resolved != null);
  }
  return { hasPhoto: resolved != null && loaded, reportLoaded: setLoaded };
}

export function RemoteImage({
  src,
  style,
  placeholder,
  accessibilityLabel,
  onStatusChange,
}: {
  /** Storage 路径 / 本地资源 id / 空 */
  src: ImageSrc;
  /** 同时作用于图片与占位，两者必须同尺寸 */
  style?: StyleProp<ViewStyle & ImageStyle>;
  /** 没有图或加载失败时画什么 */
  placeholder?: ReactNode;
  accessibilityLabel?: string;
  /** 真图是否到位；压在图上写字的地方用它决定蒙层与字色 */
  onStatusChange?: (loaded: boolean) => void;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = typeof src === 'number' ? src : imageSource(src);

  if (resolved == null || failed) {
    return (
      <View style={style} accessibilityLabel={accessibilityLabel}>
        {placeholder ?? null}
      </View>
    );
  }

  return (
    <Image
      source={resolved}
      style={style}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={120}
      accessibilityLabel={accessibilityLabel}
      onError={() => {
        setFailed(true);
        onStatusChange?.(false);
      }}
      onLoad={() => onStatusChange?.(true)}
    />
  );
}
