/**
 * 照片打卡 —— 独立整页层，不引用设计系统的表单组件。
 *
 * 整个弹层只有一张拍立得卡片：左上角关闭、右上角保存。
 * 保存结果与打卡弹层同一套语义：成功打勾，失败给叉并允许原地重试。
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Body, Caption, Micro } from '@/components/text';
import { ScaleIn } from '@/motion';
import type { PreparedPhoto } from '@/photo';
import { alpha, color, motion as mt, radius } from '@/theme';

/** 文案上限：拍立得白边写不下太多字 */
const CAPTION_MAX = 60;

type PhotoCardProps = {
  dayLabel: string;
  dateLine: string;
  caption: string;
  onCaptionChange: (v: string) => void;
  photo: PreparedPhoto | null;
  busy: boolean;
  error: string;
  saved: boolean;
  failed: boolean;
  canSave: boolean;
  onClose: () => void;
  onPick: () => void;
  onClear: () => void;
  onSave: () => void;
};

export function PhotoCheckinModal({ open, onClose, ...card }: PhotoCardProps & { open: boolean }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-8">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="关闭"
          onPress={onClose}
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(24,24,27,0.45)' }}
        />
        {/* 关闭时整块卸载：卡片自己的输入状态随之复位，不必在 effect 里回写 */}
        {open ? <PhotoCard {...card} onClose={onClose} /> : null}
        <View style={{ height: insets.bottom }} />
      </View>
    </Modal>
  );
}

function PhotoCard({
  dayLabel,
  dateLine,
  caption,
  onCaptionChange,
  photo,
  busy,
  error,
  saved,
  failed,
  canSave,
  onClose,
  onPick,
  onClear,
  onSave,
}: PhotoCardProps) {
  const [writing, setWriting] = useState(false);
  const spinner = useSpinnerStyle(busy);
  const shakeStyle = useShakeStyle(failed);
  const remain = CAPTION_MAX - caption.length;

  return (
    <>
      <ScaleIn
        from={0.82}
        spring={{ damping: 26, stiffness: 320 }}
        style={{ width: '100%', maxWidth: 268 }}>
        {/* 两枚圆形按钮：压在卡片上缘两角 */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="关闭"
          onPress={onClose}
          hitSlop={6}
          className="bg-card absolute -top-3 -left-3 z-10 h-11 w-11 items-center justify-center rounded-full"
          style={{
            boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 16, color: 'rgba(0,0,0,0.18)' }],
          }}>
          <Icon name="x" size="md" tone="soft" strokeWidth={2.5} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={busy ? '保存中' : '保存'}
          accessibilityState={{ disabled: !canSave, busy }}
          disabled={!canSave}
          onPress={onSave}
          hitSlop={6}
          className={`absolute -top-3 -right-3 z-10 h-11 w-11 items-center justify-center rounded-full ${
            canSave ? 'bg-ink' : 'bg-card'
          }`}
          style={{
            boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 16, color: 'rgba(0,0,0,0.18)' }],
          }}>
          {busy ? (
            <Animated.View style={spinner}>
              <ActivityIndicator size="small" color={color.card} />
            </Animated.View>
          ) : (
            <Icon name="check" size="md" tone={canSave ? 'invert' : 'muted'} strokeWidth={2.8} />
          )}
        </Pressable>

        {/* 拍立得本体 */}
        <View
          className="bg-card p-3.5 pb-4"
          style={{
            borderRadius: radius.xs,
            boxShadow: [{ offsetX: 0, offsetY: 18, blurRadius: 50, color: 'rgba(0,0,0,0.28)' }],
          }}>
          {photo ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="换一张照片"
              onPress={onPick}
              className="bg-fill aspect-square w-full overflow-hidden">
              <Image
                source={{ uri: photo.uri }}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
              />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="拍照或选图"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={onPick}
              className="bg-fill/70 aspect-square w-full items-center justify-center gap-3">
              <View
                className="bg-card h-14 w-14 items-center justify-center rounded-full"
                style={{
                  boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 10, color: 'rgba(0,0,0,0.1)' }],
                }}>
                <Icon name="camera" size="xl" tone="soft" />
              </View>
              <Body weight="font-semibold">{busy ? '处理中…' : '拍照或选图'}</Body>
            </Pressable>
          )}

          {/* 文字记录：写在白边上，像在真照片背面写字 */}
          <View className="pt-3.5">
            <TextInput
              value={caption}
              onChangeText={onCaptionChange}
              onFocus={() => setWriting(true)}
              onBlur={() => setWriting(false)}
              maxLength={CAPTION_MAX}
              multiline
              placeholder="写点什么…"
              placeholderTextColor="rgba(196,196,204,1)"
              accessibilityLabel="照片文案"
              className="text-ink w-full text-center"
              style={{ minHeight: 44, fontSize: 14.5, lineHeight: 24 }}
            />

            <View className="mt-1.5 flex-row items-center justify-between">
              <Caption size="text-[10.5px]">{dateLine}</Caption>
              {writing && remain <= 20 ? (
                <Caption tabular size="text-[10.5px]" tone={remain <= 5 ? 'danger' : 'muted'}>
                  {String(remain)}
                </Caption>
              ) : null}
            </View>
          </View>
        </View>

        {/* 错误与压缩说明挂在卡片外，不挤占白边 */}
        <View className="mt-3 items-center">
          {error ? (
            <Caption tone="danger" className="text-center">
              {error}
            </Caption>
          ) : photo ? (
            <Caption
              size="text-[11.5px]"
              className="text-center"
              style={{ color: alpha.glassLight }}>
              {photo.width > 0 ? `${photo.width}×${photo.height} · ` : ''}
              {photo.compressed ? '已压缩到长边 1600' : '未压缩'}
            </Caption>
          ) : (
            <Caption
              size="text-[11.5px]"
              className="text-center"
              style={{ color: alpha.glassLight }}>
              上传前自动压缩，不存原图
            </Caption>
          )}
        </View>

        {saved || failed ? (
          <View
            className="bg-card absolute inset-0 items-center justify-center gap-2.5"
            style={{ borderRadius: radius.xs }}>
            <Animated.View style={shakeStyle}>
              <ScaleIn from={failed ? 0.5 : 0.3} spring={mt.spring.pop}>
                <View
                  className={`h-14 w-14 items-center justify-center rounded-full ${
                    failed ? 'bg-danger-tint' : 'bg-ink'
                  }`}>
                  <Icon
                    name={failed ? 'x' : 'check'}
                    size="xl"
                    tone={failed ? 'danger' : 'invert'}
                    strokeWidth={3}
                  />
                </View>
              </ScaleIn>
            </Animated.View>
            <Body weight="font-semibold">{failed ? '保存失败' : `已记录到${dayLabel}`}</Body>
            {failed ? <Micro>再试一次</Micro> : null}
          </View>
        ) : null}
      </ScaleIn>

      {photo && !saved && !failed ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="不使用这张照片"
          onPress={onClear}
          hitSlop={8}
          className="mt-4">
          <Micro tone="invert">重新选一张</Micro>
        </Pressable>
      ) : null}
    </>
  );
}

/** 失败时的横向抖动：幅度 8，节奏取 motion 的 fast 令牌 */
function useShakeStyle(failed: boolean) {
  const shake = useSharedValue(0);

  useEffect(() => {
    if (!failed) return;
    const step = mt.duration.fast * 1000;
    shake.set(
      withSequence(
        withTiming(-1, { duration: step, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: step, easing: Easing.out(Easing.quad) }),
        withTiming(-0.6, { duration: step, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: step, easing: Easing.out(Easing.quad) })
      )
    );
  }, [failed, shake]);

  return useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() * 8 }] }));
}

function useSpinnerStyle(active: boolean) {
  const spin = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      spin.set(0);
      return;
    }
    spin.set(withRepeat(withTiming(360, { duration: 800, easing: Easing.linear }), -1, false));
  }, [active, spin]);

  return useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.get()}deg` }] }));
}
