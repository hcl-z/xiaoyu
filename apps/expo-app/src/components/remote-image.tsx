/**
 * RemoteImage — 网络图的统一入口
 * ------------------------------------------------------------------
 * 网络图一定会失败：服务端没有这张图、离线、链接失效。
 * RN 默认什么都不画，列表行里就留一个空洞，卡片上只剩一层渐变。
 * 所以这里把「取不到图」收敛成一个显式状态：失败就换调用方给的占位，
 * 界面形状不塌，也不必每个用到图的地方各写一遍 onError。
 *
 * 受会话保护的图（/api/photos/…）必须带头取：服务端按会话校验归属，
 * 裸 URL 会 401。这件事在组件内部自动完成，调用方只管给地址，
 * 否则每多一处用图的地方就多一次忘带 token 的机会。
 */
import { useState, type ReactNode } from 'react';
import { Image, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { authedImageSource, isProtectedImage } from '@/data/client';

/**
 * 图到底有没有到位——压在图片上写字的卡片据此切换蒙层与字色。
 * 口径与 RemoteImage 一致：没有地址、加载失败，都算「没有图」。
 */
export function useImageStatus(uri: string | null | undefined) {
  const [seenUri, setSeenUri] = useState(uri);
  const [loaded, setLoaded] = useState(uri != null);
  /** 换了地址要重新判断（React 官方的「props 变化时调整 state」写法） */
  if (seenUri !== uri) {
    setSeenUri(uri);
    setLoaded(uri != null);
  }
  return { hasPhoto: uri != null && loaded, reportLoaded: setLoaded };
}

export function RemoteImage({
  uri,
  style,
  placeholder,
  accessibilityLabel,
  onStatusChange,
}: {
  uri: string | null | undefined;
  /** 同时作用于图片与占位，两者必须同尺寸 */
  style?: StyleProp<ViewStyle & ImageStyle>;
  /** 没有图或加载失败时画什么 */
  placeholder?: ReactNode;
  accessibilityLabel?: string;
  /** 真图是否到位；压在图上写字的地方用它决定蒙层与字色 */
  onStatusChange?: (loaded: boolean) => void;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  /** 换了地址要重新给一次机会（React 官方的「props 变化时调整 state」写法） */
  const [seenUri, setSeenUri] = useState(uri);
  if (seenUri !== uri) {
    setSeenUri(uri);
    setFailedUri(null);
  }
  const failed = uri != null && failedUri === uri;
  // 受保护图自动带令牌；静态资源与外部图照旧裸取
  const source = uri && isProtectedImage(uri) ? authedImageSource(uri) : { uri: uri ?? '' };

  if (!uri || failed) {
    return (
      <View className="bg-tint items-center justify-center" style={style}>
        {placeholder}
      </View>
    );
  }

  return (
    <Image
      source={source}
      resizeMode="cover"
      onLoad={() => onStatusChange?.(true)}
      onError={() => {
        setFailedUri(uri);
        onStatusChange?.(false);
      }}
      accessibilityLabel={accessibilityLabel}
      style={style}
    />
  );
}
