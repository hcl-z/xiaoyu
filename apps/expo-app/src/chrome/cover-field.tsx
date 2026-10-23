/**
 * CoverField — 菜谱封面
 * ------------------------------------------------------------------
 * 一块与输入行同高的填充面：左边是缩略图，右边是文字。点整块换图。
 *
 * 为什么需要动作单：launchImageLibraryAsync 只打开相册，
 * **它本身不带相机入口**（见 expo-image-picker 的 API 说明）。
 * 所以「拍一张」必须显式走 launchCameraAsync，两者要问用户一下。
 *
 * 图片走与照片打卡同一条通道（压缩到长边 1600 / JPEG 0.8 → /api/photos）：
 * 服务端按会话校验归属，返回的站内路径直接存进 recipe.image。
 */
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { RemoteImage } from '@/components/remote-image';
import { Body, Caption } from '@/components/text';
import { apiUrl } from '@/data/client';
import { pickPhoto, photoPath, uploadPhoto, type PhotoSource } from '@/photo';
import { color, hairline, radius } from '@/theme';

import { ActionSheet, ActionSheetIcon } from './action-sheet';

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

/**
 * 封面瓦片边长。
 * 与右侧两行输入（50 + 10 + 50 = 110）等高，左右两侧顶对齐后
 * 形成一块规整的 110x110 区，不是“一张小图配两行字”的松散排版。
 */
export const THUMB = 110;

export function CoverField({
  /** 已保存的封面地址（站内相对路径或空串） */
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (image: string) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  /** 动作单开关：点封面时要先问清「拍一张还是从相册选」 */
  const [chooser, setChooser] = useState(false);

  /**
   * 真正的取图。source 必须由用户选定：
   * launchImageLibraryAsync 只会打开相册，它自己不带相机入口，
   * 所以「拍照」这条路必须显式走 launchCameraAsync，否则用户永远看不到相机。
   */
  const choose = useCallback(
    async (source: PhotoSource) => {
      setChooser(false);
      setError('');
      setBusy(true);
      try {
        const picked = await pickPhoto(source);
        // 用户取消不算失败，也不清掉已有封面
        if (!picked) return;
        const id = await uploadPhoto(picked, 'recipe-cover.jpg');
        onChange(photoPath(id));
      } catch (e) {
        setError(e instanceof Error ? e.message : '上传失败，请重试');
      } finally {
        setBusy(false);
      }
    },
    [onChange]
  );

  const hasImage = value !== '';
  const inert = disabled || busy;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hasImage ? '更换封面图' : '添加封面图'}
        accessibilityState={{ disabled: inert, busy }}
        disabled={inert}
        onPress={() => setChooser(true)}
        className={cx('shrink-0', inert ? 'opacity-45' : 'active:opacity-75')}>
        <CoverThumb value={value} busy={busy} />
      </Pressable>

      {error ? (
        <Caption tone="danger" size="text-[12px]" className="mt-1.5">
          {error}
        </Caption>
      ) : null}

      <ActionSheet
        open={chooser}
        title={hasImage ? '更换封面图' : '添加封面图'}
        onCancel={() => setChooser(false)}
        actions={[
          {
            label: '拍一张',
            icon: (
              <ActionSheetIcon>
                <Icon name="camera" size="md" tone="accent" />
              </ActionSheetIcon>
            ),
            onPress: () => void choose('camera'),
          },
          {
            label: '从相册选',
            icon: (
              <ActionSheetIcon>
                <Icon name="image-plus" size="md" tone="accent" />
              </ActionSheetIcon>
            ),
            onPress: () => void choose('library'),
          },
          ...(hasImage
            ? [
                {
                  label: '移除封面图',
                  destructive: true,
                  onPress: () => {
                    setChooser(false);
                    setError('');
                    onChange('');
                  },
                },
              ]
            : []),
        ]}
      />
    </>
  );
}

function CoverThumb({ value, busy }: { value: string; busy: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(busy ? 1 : 0, { duration: 160 }));
  }, [progress, busy]);

  const veil = useAnimatedStyle(() => ({ opacity: progress.get() }));

  return (
    <View
      className="items-center justify-center overflow-hidden"
      style={{
        width: THUMB,
        height: THUMB,
        borderRadius: radius.control,
        backgroundColor: color.fill,
        borderWidth: value ? 0 : hairline,
        // 空态用虚线边：一眼能看出“这里可以放一张图”
        borderStyle: value ? 'solid' : 'dashed',
        borderColor: color.hair,
      }}>
      {value ? (
        <RemoteImage
          uri={apiUrl(value)}
          style={{ width: THUMB, height: THUMB }}
          accessibilityLabel="菜谱封面"
        />
      ) : (
        <View className="items-center gap-1.5">
          <Icon name="image-plus" size="lg" tone="muted" />
          <Body tone="muted" size="text-[12px]" weight="font-normal">
            加封面
          </Body>
        </View>
      )}
      {/* 上传中：压一层暗罩 + 转圈。转圈只在真正忙时挂载，不空转 */}
      {busy ? (
        <Animated.View
          pointerEvents="none"
          style={[
            veil,
            {
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: color.ink,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}>
          <ActivityIndicator color={color.card} />
        </Animated.View>
      ) : null}
    </View>
  );
}
