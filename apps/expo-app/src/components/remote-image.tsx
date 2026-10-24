/**
 * RemoteImage — 图片的统一入口
 * ------------------------------------------------------------------
 * 网络图一定会失败：Storage 里没有这张图、离线、链接失效。
 * RN 默认什么都不画，列表行里就留一个空洞，卡片上只剩一层渐变。
 * 所以这里把「取不到图」收敛成一个显式状态：失败就换调用方给的占位，
 * 界面形状不塌，也不必每个用到图的地方各写一遍 onError。
 *
 * src 的三种取值：Storage 路径（转公共 URL）、seed: 内置插画（本地资源，
 * 不走网络也不会失败）、空（占位）。
 */
import { useState, type ReactNode } from 'react';
import { Image, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

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
  /** Storage 路径 / seed: 标识 / 本地资源 id / 空 */
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
      accessibilityLabel={accessibilityLabel}
      onError={() => {
        setFailed(true);
        onStatusChange?.(false);
      }}
      onLoad={() => onStatusChange?.(true)}
    />
  );
}
