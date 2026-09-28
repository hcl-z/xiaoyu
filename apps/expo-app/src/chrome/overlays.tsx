/**
 * Alert · SuccessOverlay · FullScreenModal
 * ------------------------------------------------------------------
 * Web 用 fixed + AnimatePresence 叠层；原生用 RN Modal 与绝对定位视图。
 * Web 的 u-glass-dark 背板（backdrop-filter）换成半透明实色；
 * 过渡统一走 @/motion 的落位与弹簧原语。
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

import { ScaleIn, usePresence, useSpringPresence } from '@/motion';
import { alpha, color, elevationStyle, hairline, layout, radius } from '@/theme';

import { Icon, type IconName } from '@/components/icon';
import { Body, Caption, Micro, Subhead } from '@/components/text';

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ */
/* Alert — 破坏性操作的确认                                              */
/* ------------------------------------------------------------------ */
export function Alert({
  open,
  title,
  message,
  cancelLabel = '取消',
  confirmLabel = '确认',
  destructive = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  const content = (
    <View className="flex-1 items-center justify-center p-8">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="取消"
        onPress={onCancel}
        className="absolute inset-0"
        style={{ backgroundColor: alpha.glassDark }}
      />
      <ScaleIn from={0.86} style={{ width: '100%', maxWidth: 280 }}>
        <View className="rounded-card bg-card" style={elevationStyle.float}>
          <View
            testID="alert-clip-layer"
            className="rounded-card border-hair/70 bg-card overflow-hidden border">
            <View className="items-center px-5 pt-5 pb-4">
              <Subhead size="text-[17px]" className="text-center">
                {title}
              </Subhead>
              {message ? (
                <Caption size="text-[13px]" className="mt-2 text-center leading-relaxed">
                  {message}
                </Caption>
              ) : null}
            </View>
            <View className="border-hair flex-row border-t">
              <AlertButton
                label={cancelLabel}
                onPress={onCancel}
                tone="accent"
                weight="font-medium"
              />
              <View style={{ width: hairline, backgroundColor: color.hair }} />
              <AlertButton
                label={confirmLabel}
                onPress={onConfirm}
                tone={destructive ? 'danger' : 'accent'}
                weight="font-semibold"
              />
            </View>
          </View>
        </View>
      </ScaleIn>
    </View>
  );

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      {content}
    </Modal>
  );
}

function AlertButton({
  label,
  onPress,
  tone,
  weight,
}: {
  label: string;
  onPress: () => void;
  tone: 'accent' | 'danger';
  weight: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="active:bg-tint/60 h-11 flex-1 flex-row items-center justify-center">
      <Body tone={tone} weight={weight}>
        {label}
      </Body>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* SuccessOverlay — 保存成功态（覆盖在弹层上）                            */
/* ------------------------------------------------------------------ */
/**
 * 覆盖父容器的成功态。父容器需要是定位上下文（默认就是）。
 * 挂载/卸载由 usePresence 控制：先播完淡出再卸载。
 */
export function SuccessOverlay({
  open,
  title,
  caption,
}: {
  open: boolean;
  title: string;
  caption?: string;
}) {
  const { mounted, progress } = usePresence(open);
  const fade = useAnimatedStyle(() => ({ opacity: progress.get() }));

  if (!mounted) return null;

  return (
    // Animated.View 不受 NativeWind 接管，所以这里用 style 而不是 className
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        {
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.95)',
        },
        fade,
      ]}>
      <ScaleIn from={0.4} spring={{ damping: 16, stiffness: 420 }}>
        <View className="bg-lake h-16 w-16 flex-row items-center justify-center rounded-full">
          <Icon name="check" size="xl" tone="invert" strokeWidth={3} />
        </View>
      </ScaleIn>
      <Subhead size="text-[16px]" className="mt-3">
        {title}
      </Subhead>
      {caption ? <Micro className="mt-1">{caption}</Micro> : null}
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* FullScreenModal — 自成一体的任务层（对应 iOS fullScreenCover）          */
/* ------------------------------------------------------------------ */
export type ModalButton = {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** plain = 灵灰底（默认，给关闭）、accent = 蓝底白字（给提交）、danger = 红字 */
  tone?: 'plain' | 'accent' | 'danger';
};

const MODAL_BUTTON_BOX: Record<NonNullable<ModalButton['tone']>, string> = {
  plain: 'bg-fill active:bg-fill-deep',
  accent: 'bg-indigo active:bg-indigo-deep',
  danger: 'bg-danger-tint',
};

const MODAL_BUTTON_TONE: Record<NonNullable<ModalButton['tone']>, 'soft' | 'invert' | 'danger'> = {
  plain: 'soft',
  accent: 'invert',
  danger: 'danger',
};

function ModalCircleButton({ icon, label, onPress, disabled, tone = 'plain' }: ModalButton) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      className={cx(
        'h-9 w-9 shrink-0 flex-row items-center justify-center rounded-full',
        disabled ? 'bg-fill' : MODAL_BUTTON_BOX[tone]
      )}>
      <Icon
        name={icon}
        size="md"
        tone={disabled ? 'muted' : MODAL_BUTTON_TONE[tone]}
        strokeWidth={2.2}
      />
    </Pressable>
  );
}

/**
 * TaskScreen — 全屏任务页的骨架。
 *
 * 与 FullScreenModal 的分工：FullScreenModal 自带 RN Modal 与弹簧进出场，
 * 适合「就地叠一层」；TaskScreen 只画骨架，交给 Expo Router 的
 * ModalRoute 接管呈现（透明路由 + 自绘背板与圆角面板）。
 * 两条路径共用同一份排版，视觉不会分叉。
 */

export type TaskScreenProps = {
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** 左上角；省略时自动给一枚关闭按钮 */
  leading?: ModalButton | null;
  /** 右上角；通常是提交动作 */
  trailing?: ModalButton | null;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  /** 作为弹窗出现时带上上缘圆角；占满整屏（路由 modal）时留直角 */
  rounded?: boolean;
};

export function TaskScreen({
  onClose,
  title,
  subtitle,
  leading,
  trailing,
  children,
  footer,
  closeLabel = '关闭',
  rounded = false,
}: TaskScreenProps) {
  const insets = useSafeAreaInsets();
  const left: ModalButton | null =
    leading === undefined ? { icon: 'x', label: closeLabel, onPress: onClose } : leading;

  return (
    <View
      className="bg-paper flex-1 overflow-hidden"
      style={{
        // 弹窗铺满整屏，顶部安全区由内容自己让开
        paddingTop: insets.top,
        ...(rounded
          ? {
              borderTopLeftRadius: radius.sheet,
              borderTopRightRadius: radius.sheet,
              borderTopWidth: hairline,
              borderColor: color.hair,
            }
          : null),
      }}>
      <View
        className="border-hair/70 bg-paper/95 z-10 shrink-0 flex-row items-center gap-3 border-b px-3"
        style={{ minHeight: layout.navH + 12 }}>
        <View className="min-w-9 flex-row items-center">
          {left ? <ModalCircleButton {...left} /> : null}
        </View>
        <View className="min-w-0 flex-1 items-center">
          {typeof title === 'string' ? (
            <Body weight="font-semibold" numberOfLines={1}>
              {title}
            </Body>
          ) : (
            title
          )}
          {typeof subtitle === 'string' ? (
            <Micro numberOfLines={1} className="mt-0.5">
              {subtitle}
            </Micro>
          ) : (
            subtitle
          )}
        </View>
        <View className="min-w-9 flex-row items-center justify-end">
          {trailing ? <ModalCircleButton {...trailing} /> : null}
        </View>
      </View>

      <ScrollView
        className="min-h-0 flex-1"
        contentContainerClassName="pb-6"
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>

      {footer ? (
        <View
          className="border-hair/70 bg-paper/95 shrink-0 border-t px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

/**
 * 全屏弹窗：给「必须完成或放弃」的自成体任务用（新建 / 编辑）。
 * 与 Sheet 的分工：Sheet 是轻量就地输入，FullScreenModal 接管整屏。
 * 顶部左右各一枚圆形按钮，中间标题；左侧缺省就是关闭。
 */
export function FullScreenModal({
  open,
  onClose,
  title,
  subtitle,
  leading,
  trailing,
  children,
  footer,
  closeLabel = '关闭',
}: {
  open: boolean;
} & TaskScreenProps) {
  const { height } = useWindowDimensions();
  const { mounted, progress } = useSpringPresence(open);
  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * height }],
  }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View className="flex-1">
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: alpha.glassDark,
            },
            backdropStyle,
          ]}
        />
        <Animated.View
          style={[
            elevationStyle.sheet,
            panelStyle,
            {
              flex: 1,
              // 铺满整屏：上缘贴住屏幕顶，状态栏区域由骨架自己让开
              overflow: 'hidden',
              borderTopLeftRadius: radius.sheet,
              borderTopRightRadius: radius.sheet,
              backgroundColor: color.paper,
            },
          ]}>
          <TaskScreen
            onClose={onClose}
            title={title}
            subtitle={subtitle}
            leading={leading}
            trailing={trailing}
            footer={footer}
            closeLabel={closeLabel}
            rounded>
            {children}
          </TaskScreen>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* ModalRoute — 路由式全屏弹窗                                           */
/* ------------------------------------------------------------------ */
/**
 * Expo Router 的 fullScreenModal 是系统整屏呈现：没有背板、上缘是直角，
 * 和 Web 端 FullScreenModal「上缘留 12pt + 28 圆角 + 压暗的上一页」对不上。
 * 这里把路由改成 transparentModal（上一页留在后面可见），动画自己接管：
 * 背板只切透明度、面板走弹簧上推进出，与 Web 的 motion.div 一一对应。
 *
 * 退场要先播完再出栈，所以拦截 beforeRemove；动画结束后把原来的导航动作
 * 派发出去——页面里的 router.back() / router.replace() 都不用改。
 */
export function ModalRoute({ children }: { children: ReactNode }) {
  const navigation = useNavigation();
  const { height } = useWindowDimensions();
  /** 首帧先停在画面外，挂载后立刻交给弹簧推进来 */
  const [visible, setVisible] = useState(false);
  const { mounted, progress } = useSpringPresence(visible);
  const pending = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);

  /** 首帧先按画面外渲染，下一帧再交给弹簧推进来；直接写在 effect 里会触发连锁渲染 */
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!visible) return;
      e.preventDefault();
      pending.current = e.data.action;
      setVisible(false);
    });
  }, [navigation, visible]);

  useEffect(() => {
    if (visible || mounted) return;
    const action = pending.current;
    pending.current = null;
    if (action) navigation.dispatch(action);
  }, [visible, mounted, navigation]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * height }],
  }));

  return (
    // 背板 + 面板都自己画，所以路由容器必须透明，上一页才能透出来
    <View className="flex-1 items-center" style={{ backgroundColor: 'transparent' }}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: alpha.glassDark }, backdropStyle]}
      />
      <Animated.View
        style={[
          elevationStyle.sheet,
          panelStyle,
          {
            flex: 1,
            width: '100%',
            maxWidth: layout.appMaxW,
            // 铺满整屏：上缘贴住屏幕顶，状态栏区域由骨架自己让开
            backgroundColor: color.paper,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            overflow: 'hidden',
          },
        ]}>
        {children}
      </Animated.View>
    </View>
  );
}
