"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, X } from "lucide-react";
import { color, layout, motion as mt } from "@/design/tokens";
import { Caption, Display, Micro } from "./text";

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Device chrome                                                        */
/* ------------------------------------------------------------------ */
export function HomeIndicator({ className = "" }: { className?: string }) {
  return (
    <div className={cx("pointer-events-none flex justify-center pb-1.5 pt-1", className)} aria-hidden>
      <span className="h-[5px] w-[118px] rounded-full bg-ink/25" />
    </div>
  );
}

export function PhoneFrame({
  children,
  className = "",
  innerClassName = "",
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-frame bg-[linear-gradient(150deg,#3a3d42,#17181b_55%,#2c2f34)] p-[10px] shadow-float",
        className,
      )}
    >
      <div className={cx("relative w-full overflow-hidden rounded-screen bg-paper", innerClassName)}>
        {children}
      </div>
    </div>
  );
}

export function AppScreen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx("mx-auto flex min-h-[796px] w-full flex-col bg-paper", className)}
      style={{ maxWidth: layout.appMaxW }}
    >
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">{children}</main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* NavBar · 范式 A（Large Title）与范式 B（紧凑导航条）                   */
/* ------------------------------------------------------------------ */
export function NavBar({
  variant = "large",
  title,
  largeTitle,
  subtitle,
  onBack,
  backLabel = "返回",
  leading,
  trailing,
  sticky = true,
  transparent = false,
  className = "",
}: {
  variant?: "large" | "compact";
  title?: string;
  largeTitle?: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  sticky?: boolean;
  transparent?: boolean;
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <div
        className={cx(
          "z-30 flex items-center justify-between gap-2 px-3",
          sticky && "sticky top-0",
          transparent ? "" : "u-glass border-b border-hair/70",
          className,
        )}
        style={{ height: layout.navH }}
      >
        <div className="flex min-w-[84px] items-center">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel || "返回"}
              className="-ml-1 flex items-center gap-0.5 py-2 pr-2 text-indigo transition-opacity active:opacity-50"
            >
              <ChevronLeft size={20} strokeWidth={2.2} />
              {backLabel ? <span className="text-[15px] font-medium">{backLabel}</span> : null}
            </button>
          ) : (
            leading
          )}
        </div>
        {title ? (
          <span className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold text-ink">
            {title}
          </span>
        ) : (
          <span className="flex-1" />
        )}
        <div className="flex min-w-[84px] items-center justify-end gap-2">{trailing}</div>
      </div>
    );
  }

  return (
    <div className={cx("flex items-start justify-between gap-4 px-5 pt-3", className)}>
      <div className="min-w-0">
        <Display as="h1">{largeTitle ?? title}</Display>
        {subtitle ? <Caption className="mt-2 block">{subtitle}</Caption> : null}
      </div>
      {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TabBar                                                               */
/* ------------------------------------------------------------------ */
export type TabItem = { value: string; label: string; icon: ReactNode };

export function TabBar({
  items,
  active,
  onSelect,
  onAction,
  actionIcon,
  actionLabel = "打卡",
}: {
  items: TabItem[];
  active: string;
  onSelect: (v: string) => void;
  onAction?: () => void;
  actionIcon?: ReactNode;
  actionLabel?: string;
}) {
  const Tab = ({ item }: { item: TabItem }) => {
    const on = item.value === active;
    return (
      <button
        type="button"
        onClick={() => onSelect(item.value)}
        aria-current={on ? "page" : undefined}
        className={cx(
          "flex w-16 flex-col items-center gap-1 transition-colors duration-200",
          on ? "text-indigo" : "text-muted hover:text-ink",
        )}
      >
        {item.icon}
        <span className="text-[10.5px] font-semibold tracking-wide">{item.label}</span>
      </button>
    );
  };
  const half = Math.ceil(items.length / 2);
  return (
    <div className="u-glass u-hairline-t">
      <div className="flex items-end justify-around px-3 pt-2.5">
        {items.slice(0, half).map((i) => (
          <Tab key={i.value} item={i} />
        ))}
        {onAction ? (
          <button
            type="button"
            aria-label={actionLabel}
            onClick={onAction}
            className="-mt-7 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-indigo text-card shadow-fab transition-transform active:scale-95"
          >
            {actionIcon}
          </button>
        ) : null}
        {items.slice(half).map((i) => (
          <Tab key={i.value} item={i} />
        ))}
      </div>
      <HomeIndicator />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sheet                                                                */
/* ------------------------------------------------------------------ */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  action,
  children,
  footer,
  elevated = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void; disabled?: boolean };
  children: ReactNode;
  footer?: ReactNode;
  /** 叠在 FullScreenModal 之上时置 true；仍低于 Alert（z-60） */
  elevated?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open ? (
        <div
          className={cx(
            "fixed inset-0 flex flex-col justify-end",
            elevated ? "z-[55]" : "z-50",
          )}
        >
          <motion.button
            type="button"
            aria-label="关闭"
            className="u-glass-dark absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={mt.spring.sheet}
            className="relative mx-auto flex max-h-[90%] w-full flex-col overflow-hidden rounded-t-sheet border-t border-hair bg-card shadow-sheet"
            style={{ maxWidth: layout.appMaxW }}
          >
            <div className="shrink-0 bg-card px-5 pb-3 pt-3">
              <div className="mx-auto h-1 w-9 rounded-full bg-hair" />
              {title ? (
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-[19px] font-semibold tracking-tight text-ink">
                      {title}
                    </h2>
                    {subtitle ? <Micro className="mt-1 block">{subtitle}</Micro> : null}
                  </div>
                  {action ? (
                    <button
                      type="button"
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className="shrink-0 text-[15px] font-semibold text-indigo disabled:text-muted/40"
                    >
                      {action.label}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="取消"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hair/60 text-muted transition-colors hover:text-ink"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-5 pb-5">{children}</div>
            {footer ? (
              <div className="shrink-0 border-t border-hair/70 bg-card px-5 pb-7 pt-4">{footer}</div>
            ) : (
              <HomeIndicator />
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* FullScreenModal — 自成一体的任务层（对应 iOS fullScreenCover）        */
/* ------------------------------------------------------------------ */

/** 导航区圆形按钮的配置；label 既做 aria-label 也做 title */
export type ModalButton = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** plain = 灵灰底（默认，给关闭）、accent = 蓝底白字（给提交）、danger = 红字 */
  tone?: "plain" | "accent" | "danger";
};

const MODAL_BUTTON_TONES = {
  plain: "bg-fill text-ink-soft hover:bg-fill-deep",
  accent: "bg-indigo text-white hover:bg-indigo-deep",
  danger: "bg-danger-tint text-danger",
} as const;

function ModalCircleButton({ icon, label, onClick, disabled, tone = "plain" }: ModalButton) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-[transform,background-color,color] duration-200 active:scale-95",
        MODAL_BUTTON_TONES[tone],
        "disabled:bg-fill disabled:text-muted/40 disabled:active:scale-100",
      )}
    >
      {icon}
    </button>
  );
}

/**
 * 全屏弹窗：给「必顶完成或放弃」的自成体任务用（新建 / 编辑）。
 *
 * 与 Sheet 的分工：Sheet 是轻量、不离开当前上下文的就地输入；
 * FullScreenModal 接管整屏，适合字段多、需要专注的表单。
 * 不要用它做层级浏览（那是 Push 路由的职责）。
 *
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
  closeLabel = "关闭",
}: {
  open: boolean;
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
}) {
  const reduce = useReducedMotion();

  // Esc 关闭 + 锁住背景滚动，避免弹窗内滚到底时带动身后的页面
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const left: ModalButton | null =
    leading === undefined
      ? { icon: <X size={18} strokeWidth={2.2} />, label: closeLabel, onClick: onClose }
      : leading;

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-center pt-3">
          <motion.div
            className="u-glass-dark absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={mt.spring.sheet}
            className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-t-sheet border-t border-hair bg-paper shadow-sheet"
            style={{ maxWidth: layout.appMaxW }}
          >
            <div
              className="u-glass z-10 flex shrink-0 items-center gap-3 rounded-t-sheet border-b border-hair/70 px-3"
              style={{ minHeight: layout.navH + 12 }}
            >
              <div className="flex min-w-9 items-center">
                {left ? <ModalCircleButton {...left} /> : null}
              </div>
              <div className="min-w-0 flex-1 text-center">
                {title ? (
                  <h2 className="truncate text-[15px] font-semibold text-ink">{title}</h2>
                ) : null}
                {subtitle ? <Micro className="mt-0.5 block truncate">{subtitle}</Micro> : null}
              </div>
              <div className="flex min-w-9 items-center justify-end">
                {trailing ? <ModalCircleButton {...trailing} /> : null}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">{children}</div>

            {footer ? (
              <div className="u-glass u-hairline-t shrink-0 px-5 pb-7 pt-4">{footer}</div>
            ) : (
              <HomeIndicator />
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/** 保存成功态（覆盖在弹层上） */
export function SuccessOverlay({
  open,
  title,
  caption,
}: {
  open: boolean;
  title: string;
  caption?: string;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-t-sheet bg-card/95 backdrop-blur"
        >
          <motion.span
            className="flex h-16 w-16 items-center justify-center rounded-full bg-lake text-white"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={mt.spring.pop}
          >
            <Check size={30} strokeWidth={3} />
          </motion.span>
          <span className="font-display text-[16px] font-semibold text-ink">{title}</span>
          {caption ? <Micro as="span">{caption}</Micro> : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Alert — 破坏性操作的确认                                             */
/* ------------------------------------------------------------------ */
export function Alert({
  open,
  title,
  message,
  cancelLabel = "取消",
  confirmLabel = "确认",
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
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8">
          <motion.button
            type="button"
            aria-label="取消"
            className="u-glass-dark absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.86 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            transition={mt.spring.pop}
            className="relative w-full max-w-[280px] overflow-hidden rounded-card border border-hair/70 bg-card/95 shadow-float backdrop-blur-2xl"
          >
            <div className="px-5 pb-4 pt-5 text-center">
              <p className="font-display text-[17px] font-semibold tracking-tight text-ink">{title}</p>
              {message ? (
                <Caption className="mt-2 block text-[13px] leading-relaxed">{message}</Caption>
              ) : null}
            </div>
            <div className="grid grid-cols-2 divide-x divide-hair border-t border-hair">
              <button
                type="button"
                onClick={onCancel}
                className="u-press h-11 text-[15px] font-medium text-indigo"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={cx(
                  "u-press h-11 text-[15px] font-semibold",
                  destructive ? "text-danger" : "text-indigo",
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/** 详情页底部固定主操作条 */
export function BottomActionBar({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <div
      className="u-glass u-hairline-t fixed bottom-0 left-1/2 z-30 w-full -translate-x-1/2 px-5 pb-6 pt-3"
      style={{ maxWidth: layout.appMaxW }}
    >
      {children}
      {caption ? (
        <div className="mt-2 text-center">
          <Micro as="span">{caption}</Micro>
        </div>
      ) : null}
    </div>
  );
}

/** 页面转场：Push（横向）/ Tab（上浮淡入） */
export function ScreenTransition({
  motionKey,
  kind = "push",
  children,
}: {
  motionKey: string;
  kind?: "push" | "tab" | "none";
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const initial =
    reduce || kind === "none"
      ? { opacity: 0 }
      : kind === "push"
        ? { opacity: 0, x: 26 }
        : { opacity: 0, y: 8 };
  const exit =
    reduce || kind === "none"
      ? { opacity: 0 }
      : kind === "push"
        ? { opacity: 0, x: -18 }
        : { opacity: 0, y: -6 };
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={motionKey}
        initial={initial}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={exit}
        transition={{ duration: mt.duration.base, ease: [0.22, 0.61, 0.36, 1] }}
        className="flex min-h-full flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export const chromeTokens = { color, layout };
