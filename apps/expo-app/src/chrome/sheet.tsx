/**
 * Sheet — 底部弹层
 * ------------------------------------------------------------------
 * 视觉契约：半透明背板、28 圆角上缘、抓手、标题行、可滚动内容、可选页脚。
 * 实现走 @gorhom/bottom-sheet 的 BottomSheetModal（官方 v5 Props 文档）：
 * - 背板交给 BottomSheetBackdrop，只在透明度上随 animatedIndex 淡入淡出，
 *   不跟着面板位移——对应 Web 端 motion.button 的 initial/animate/exit opacity；
 * - 面板的位移 / 手势 / 弹簧由库接管，animationConfigs 用与 Web 同一组弹簧，
 *   支持上推停靠与下拉关闭；
 * - 内容超高时在面板内滚动（BottomSheetScrollView），键盘弹起整层上移。
 *
 * 前提：BottomSheetModal 依赖根部的 BottomSheetModalProvider，
 * 且渲染在该 Provider 的 portal 里——它盖得住原生栈内的页面（Tab / Push），
 * 盖不住系统级 Modal。因此路由式全屏弹窗里不要再嵌一层 Sheet。
 */
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  useBottomSheetSpringConfigs,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { alpha, color, hairline, layout, motion as mt, radius } from '@/theme';

import { Icon } from '@/components/icon';
import { Body, Micro } from '@/components/text';

export type SheetAction = { label: string; onPress: () => void; disabled?: boolean };

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** 标题行右侧的蓝色动作；省略时给一枚关闭按钮 */
  action?: SheetAction;
  children: ReactNode;
  footer?: ReactNode;
  /** 停靠点；省略时按内容自适应高度，最高不超过安全区之下 90% */
  /** 关闭动画结束后的回调 */
  onDismiss?: () => void;
  /** 定高档（如 '50%'）；不传则贴合内容高度 */
  snapPoints?: (string | number)[];
};

/** 抓手：库的 handleComponent，落在面板上缘正中 */
function SheetGrip() {
  return (
    <View className="items-center pt-3 pb-1">
      <View className="bg-hair h-1 w-9 rounded-full" />
    </View>
  );
}

/**
 * 面板背景：库自带的 BottomSheetBackground 挂了 accessible + adjustable，
 * 读屏会先念出一条无意义的「Bottom Sheet」滑杆。这里换成纯装饰的一层，
 * 样式照收（absoluteFill + backgroundStyle），视觉一致但不占据焦点。
 */
function SheetBackground({ pointerEvents, style }: BottomSheetBackgroundProps) {
  return <View pointerEvents={pointerEvents} style={style} />;
}

/**
 * 弹层最外层的容器（containerComponent）。
 * 库是 portal 到根部的，和页面内容是兄弟节点，系统不会自动把页面判成「模态背景」；
 * 补一个 accessibilityViewIsModal，读屏焦点只落在弹层里，不会跑到底下的页面。
 */
function SheetContainer({ children }: { children?: ReactNode }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" accessibilityViewIsModal>
      {children}
    </View>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  action,
  children,
  footer,
  snapPoints,
  onDismiss,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const ref = useRef<BottomSheetModal>(null);

  /** 与 Web 端 Sheet 共用同一组弹簧参数（mt.spring.sheet） */
  const animationConfigs = useBottomSheetSpringConfigs(mt.spring.sheet);

  /**
   * 「开着没有」只认 ref 的占位：present / dismiss 是命令式的一对，
   * 只能跟着 open 的变化走。
   * 关键是别在从没展示过的时候 dismiss —— 那会把库内部的 modalStatus
   * 置成 DISMISSING，随后第一次 present 会被门禁挡掉（点入口没反应）。
   */
  const presented = useRef(false);
  useEffect(() => {
    const modal = ref.current;
    if (!modal) return;
    if (open) {
      if (presented.current) return;
      presented.current = true;
      modal.present();
      return;
    }
    if (!presented.current) return;
    presented.current = false;
    modal.dismiss();
  }, [open]);

  /**
   * 背板：只做透明度。
   * BottomSheetBackdrop 本体就是 absoluteFill + opacity 插值
   * （[-1, disappearsOnIndex, appearsOnIndex] -> [0, 0, opacity]），
   * 它自己不位移，位移只在面板上——对应 Web 端 mask 的 initial/animate/exit opacity。
   * 颜色取 alpha.glassDark，与 Web 的 u-glass-dark 同值 rgba(28,28,30,.32)。
   */
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={1}
        style={{ backgroundColor: alpha.glassDark }}
        pressBehavior="close"
      />
    ),
    []
  );

  const renderHandle = useCallback(() => <SheetGrip />, []);

  const header = useMemo(
    () => (
      <View className="bg-card shrink-0 px-5 pb-3">
        {title ? (
          <View className="mt-2 flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Body size="text-[19px]" weight="font-semibold" numberOfLines={1}>
                {title}
              </Body>
              {subtitle ? (
                <Micro className="mt-1" numberOfLines={1}>
                  {subtitle}
                </Micro>
              ) : null}
            </View>
            {action ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={action.label}
                accessibilityState={{ disabled: action.disabled }}
                disabled={action.disabled}
                hitSlop={6}
                onPress={action.onPress}
                className="min-h-11 shrink-0 flex-row items-center px-1">
                <Body
                  size="text-body"
                  weight="font-semibold"
                  tone={action.disabled ? 'muted' : 'accent'}>
                  {action.label}
                </Body>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="取消"
                hitSlop={6}
                onPress={onClose}
                className="bg-hair/60 h-8 w-8 shrink-0 flex-row items-center justify-center rounded-full">
                <Icon name="x" size="sm" tone="muted" />
              </Pressable>
            )}
          </View>
        ) : null}
      </View>
    ),
    [action, onClose, subtitle, title]
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props}>
        {/* 页脚贴在面板下缘（bottomInset 会把整块抬起来、下面漏出内容）；
            Web 的 pb-7 换成「安全区兜底」的等值内边距 */}
        <View
          className="border-hair/70 bg-card border-t px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 28) }}>
          {footer}
        </View>
      </BottomSheetFooter>
    ),
    [footer, insets.bottom]
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={snapPoints === undefined}
      enableDismissOnClose
      enablePanDownToClose
      enableOverDrag={false}
      topInset={insets.top}
      maxDynamicContentSize={Math.min(height * 0.9, height - insets.top - 12)}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      animationConfigs={animationConfigs}
      // 内容不再被打包成一个 adjustable 元素，读屏能逐个念到里面的标题 / 按钮
      accessible={false}
      backdropComponent={renderBackdrop}
      backgroundComponent={SheetBackground}
      containerComponent={SheetContainer}
      handleComponent={renderHandle}
      footerComponent={footer ? renderFooter : undefined}
      backgroundStyle={{
        backgroundColor: color.card,
        borderTopLeftRadius: radius.sheet,
        borderTopRightRadius: radius.sheet,
        // Web: rounded-t-sheet 之外还有一条 border-t border-hair
        borderTopWidth: hairline,
        borderTopColor: color.hair,
      }}
      style={{ alignSelf: 'center', width: '100%', maxWidth: layout.appMaxW }}
      onChange={(index) => {
        // -1 = 库已经收起（下拉或点背板）：先归还占位，再把状态回传给调用方，
        // 这样 effect 不会对着一个已经收起的弹层再 dismiss 一次。
        if (index === -1) {
          presented.current = false;
          onClose();
        }
      }}
      onDismiss={onDismiss}>
      {header}
      <BottomSheetScrollView
        /* 页脚是绝对定位覆在内容上的：官方这个开关会把页脚高度补进内容下边距，
           否则最后一行会被按钮压住、滚不过去 */
        enableFooterMarginAdjustment={Boolean(footer)}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: footer ? 20 : Math.max(insets.bottom, 20),
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

/** Sheet 内容里可直接使用的输入框（键盘与弹层联动） */
export { BottomSheetTextInput };
