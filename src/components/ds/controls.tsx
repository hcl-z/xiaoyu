"use client";

import { useId, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight, Minus, Plus } from "lucide-react";
import { motion as mt } from "@/design/tokens";

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Button — pill shapes, tinted variants                                */
/* ------------------------------------------------------------------ */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tonal"
  | "tinted"
  | "ghost"
  | "quiet"
  | "plain"
  | "gray"
  | "inverse"
  | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-indigo text-card shadow-lift hover:bg-indigo-deep active:bg-indigo-deep",
  secondary: "border border-hair bg-card text-ink hover:border-indigo/50 hover:text-indigo",
  tonal: "bg-tint text-indigo hover:bg-tint/70",
  tinted: "bg-tint text-indigo hover:bg-tint/70",
  ghost: "border border-hair bg-card text-ink hover:border-ink/30",
  quiet: "text-muted hover:text-ink",
  plain: "text-indigo hover:opacity-70",
  gray: "bg-fill text-ink hover:bg-fill-deep",
  inverse: "bg-ink text-card hover:bg-ink-soft",
  destructive: "bg-danger-tint text-danger hover:bg-danger/20",
};

const BTN_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-full px-3.5 text-[13px]",
  md: "h-[42px] gap-2 rounded-full px-4.5 text-body",
  lg: "h-[50px] gap-2 rounded-full px-6 text-body",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  block = false,
  icon,
  iconRight,
  loading = false,
  disabled = false,
  onClick,
  href,
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const cls = cx(
    "inline-flex items-center justify-center font-semibold transition-[transform,background-color,border-color,color,opacity] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
    BTN_VARIANT[variant],
    BTN_SIZE[size],
    variant === "plain" && "px-1",
    variant === "quiet" && "px-1",
    block && "w-full",
    className,
  );
  const inner = (
    <>
      {loading ? <Spinner /> : icon}
      {children}
      {iconRight}
    </>
  );
  if (href && !disabled) {
    return (
      <a href={href} aria-label={ariaLabel} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" aria-label={ariaLabel} disabled={disabled || loading} onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className="animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* IconButton — circular, four materials                                */
/* ------------------------------------------------------------------ */
export function IconButton({
  children,
  label,
  onClick,
  variant = "card",
  size = "md",
  className = "",
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  variant?: "card" | "glass" | "soft" | "fill" | "plain" | "invert";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const variants = {
    card: "border border-hair bg-card text-ink hover:border-indigo/50 hover:text-indigo",
    glass: "u-glass border border-card/50 text-ink",
    soft: "bg-tint text-indigo",
    fill: "bg-fill text-ink-soft hover:bg-fill-deep",
    plain: "bg-hair/60 text-muted",
    invert: "bg-ink text-card",
  } as const;
  const sizes = { sm: "h-8 w-8", md: "h-9 w-9", lg: "h-11 w-11" } as const;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full transition-[transform,background-color,border-color,color] duration-200 active:scale-95",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Pill — filter chip                                                   */
/* ------------------------------------------------------------------ */
export function Pill({
  children,
  active = false,
  tone = "accent",
  size = "md",
  onClick,
  className = "",
}: {
  children: ReactNode;
  active?: boolean;
  tone?: "accent" | "lake" | "neutral" | "gray";
  size?: "sm" | "md";
  onClick?: () => void;
  className?: string;
}) {
  const activeCls = {
    accent: "border-indigo bg-indigo text-card shadow-[0_8px_18px_-10px_rgba(0,122,255,0.95)]",
    lake: "border-lake bg-lake text-card",
    neutral: "border-ink bg-ink text-card",
    gray: "border-ink bg-ink text-card",
  } as const;
  const idleCls = {
    accent: "border-hair bg-card text-ink-soft hover:border-indigo/40",
    lake: "border-hair bg-card text-ink-soft hover:border-lake/40",
    neutral: "border-hair bg-card text-ink-soft hover:border-ink/30",
    gray: "border-hair bg-card text-ink-soft hover:border-ink/30",
  } as const;
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border transition-all duration-200 active:scale-[0.98]",
        size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3.5 py-1.5 text-[13px]",
        active ? activeCls[tone] : idleCls[tone],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented — shared-element indicator                                 */
/* ------------------------------------------------------------------ */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = "md",
  className = "",
}: {
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (v: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const id = useId();
  return (
    <div
      role="tablist"
      className={cx("flex gap-0.5 rounded-full border border-hair/70 bg-black/[0.045] p-[3px]", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-full transition-colors",
              size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-card shadow-card"
                transition={mt.spring.segment}
              />
            ) : null}
            <span
              className={cx(
                "relative z-10 flex items-center gap-1.5 whitespace-nowrap text-[13px] transition-colors",
                active ? "font-semibold text-ink" : "font-medium text-muted",
              )}
            >
              {o.icon}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Switch · Stepper · CheckCircle · Checkmark                           */
/* ------------------------------------------------------------------ */
export function Switch({
  checked,
  onChange,
  label,
  tone = "lake",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  tone?: "lake" | "accent";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors duration-300",
        checked ? (tone === "lake" ? "bg-lake" : "bg-indigo") : "bg-hair",
      )}
    >
      <motion.span
        className="absolute top-[3px] h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgba(28,28,30,0.25)]"
        animate={{ left: checked ? 23 : 3 }}
        transition={mt.spring.toggle}
      />
    </button>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  suffix = "",
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  label: string;
}) {
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-full border border-hair bg-card text-ink-soft transition-colors hover:border-indigo/50 hover:text-indigo disabled:opacity-35 disabled:hover:border-hair disabled:hover:text-ink-soft";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`减少${label}`}
        className={btn}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus size={14} strokeWidth={2.4} />
      </button>
      <span className="u-num min-w-[64px] text-center text-body font-semibold tabular-nums">
        {value}
        {suffix}
      </span>
      <button
        type="button"
        aria-label={`增加${label}`}
        className={btn}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus size={14} strokeWidth={2.4} />
      </button>
    </div>
  );
}

/** 圆形勾选：完成态为系统绿填充 */
export function CheckCircle({
  done,
  size = 24,
  onClick,
  label,
}: {
  done: boolean;
  size?: number;
  onClick?: () => void;
  label?: string;
}) {
  const dot = (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full border transition-all duration-300",
        done ? "border-lake bg-lake text-white" : "border-dashed border-hair text-transparent",
      )}
      style={{ width: size, height: size }}
    >
      <Check size={Math.round(size * 0.5)} strokeWidth={3} />
    </span>
  );
  if (!onClick) return dot;
  return (
    <button
      type="button"
      aria-pressed={done}
      aria-label={label}
      onClick={onClick}
      className="shrink-0 transition-transform active:scale-90"
    >
      {dot}
    </button>
  );
}



/** 右下角悬浮主操作键 */
export function FabButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo text-card shadow-fab transition-transform hover:bg-indigo-deep active:scale-95"
    >
      {children}
    </button>
  );
}
