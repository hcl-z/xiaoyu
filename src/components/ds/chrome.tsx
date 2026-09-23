"use client";

import type { ReactNode } from "react";
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
export function StatusBar({ time = layout.statusTime }: { time?: string }) {
  return (
    <div
      className="flex shrink-0 items-center justify-between px-6 text-ink"
      style={{ height: layout.safeTop }}
      aria-hidden
    >
      <span className="u-num text-[13.5px] font-semibold tracking-tight">{time}</span>
      <div className="flex items-center gap-1.5 opacity-85">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="5" width="3" height="6" rx="1" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M1 4.2a10 10 0 0 1 14 0M3.6 6.7a6.4 6.4 0 0 1 8.8 0" strokeLinecap="round" />
          <circle cx="8" cy="9.4" r="1.1" fill="currentColor" stroke="none" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12">
          <rect x="0.6" y="0.6" width="20" height="10.8" rx="3.2" fill="none" stroke="currentColor" strokeOpacity="0.45" />
          <rect x="2.4" y="2.4" width="14" height="7.2" rx="2" fill="currentColor" />
          <path d="M22.4 4.2v3.6a2 2 0 0 0 0-3.6Z" fill="currentColor" fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

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
      <StatusBar />
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
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void; disabled?: boolean };
  children: ReactNode;
  footer?: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
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
