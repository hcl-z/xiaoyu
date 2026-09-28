/**
 * RemoteImage — 网络图的统一入口
 * ------------------------------------------------------------------
 * 网络图一定会失败：服务端没有这张图、离线、链接失效。
 * RN 默认什么都不画，列表行里就留一个空洞，卡片上只剩一层渐变。
 * 所以这里把「取不到图」收敛成一个显式状态：失败就换调用方给的占位，
 * 界面形状不塌，也不必每个用到图的地方各写一遍 onError。
 */
import { useState, type ReactNode } from 'react';
import { Image, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

export function RemoteImage({
  uri,
  style,
  placeholder,
  accessibilityLabel,
}: {
  uri: string | null | undefined;
  /** 同时作用于图片与占位，两者必须同尺寸 */
  style?: StyleProp<ViewStyle & ImageStyle>;
  /** 没有图或加载失败时画什么 */
  placeholder?: ReactNode;
  accessibilityLabel?: string;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  /** 换了地址要重新给一次机会（React 官方的「props 变化时调整 state」写法） */
  const [seenUri, setSeenUri] = useState(uri);
  if (seenUri !== uri) {
    setSeenUri(uri);
    setFailedUri(null);
  }
  const failed = uri != null && failedUri === uri;

  if (!uri || failed) {
    return (
      <View className="bg-tint items-center justify-center" style={style}>
        {placeholder}
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      resizeMode="cover"
      onError={() => setFailedUri(uri)}
      accessibilityLabel={accessibilityLabel}
      style={style}
    />
  );
}
