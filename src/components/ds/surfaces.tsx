"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { color } from "@/design/tokens";
import { Body, Caption, Micro } from "./text";

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Surfaces — floating hairline cards                                   */
/* ------------------------------------------------------------------ */
export function Card({
  children,
  className = "",
  padded = true,
  tone = "card",
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  tone?: "card" | "deep" | "fill" | "accent" | "tint" | "lake";
}) {
  const tones = {
    card: "bg-card border-hair/80",
    deep: "bg-paper-deep border-hair/70",
    fill: "bg-fill border-hair/60",
    accent: "bg-tint border-indigo/25",
    tint: "bg-tint border-indigo/25",
    lake: "bg-lake-tint border-lake/25",
  } as const;
  return (
    <div
      className={cx(
        "overflow-hidden rounded-card border shadow-card",
        tones[tone],
        padded && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** 页面唯一的容器：卡片 + 可选小标题 + 可选脚注 */
export function Section({
  title,
  footer,
  children,
  padded = false,
  tone = "card",
  className = "",
}: {
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  padded?: boolean;
  tone?: "card" | "deep" | "fill" | "accent" | "tint" | "lake";
  className?: string;
}) {
  return (
    <section className={className}>
      {title ? (
        <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
          {typeof title === "string" ? <Micro>{title}</Micro> : title}
        </div>
      ) : null}
      <Card padded={padded} tone={tone}>
        {children}
      </Card>
      {footer ? (
        <div className="mt-2 px-1">
          {typeof footer === "string" ? <Caption>{footer}</Caption> : footer}
        </div>
      ) : null}
    </section>
  );
}

export function SectionHeader({
  label,
  title,
  trailing,
  className = "",
}: {
  label?: string;
  title?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mb-2 flex items-baseline justify-between gap-3 px-1", className)}>
      <div className="flex min-w-0 items-baseline gap-2.5">
        {label ? <Micro>{label}</Micro> : null}
        {title}
      </div>
      {trailing}
    </div>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <div className={cx("h-px bg-hair", className)} />;
}

/** 分组列表：圆角 18，描边，行间发丝线由 ListRow 自带 */
export function ListGroup({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("overflow-hidden rounded-group border border-hair/70 bg-card", className)}>
      {children}
    </div>
  );
}

export type Accessory = "chevron" | "check" | "none";

export function ListRow({
  leading,
  title,
  subtitle,
  value,
  trailing,
  accessory = "none",
  onClick,
  destructive = false,
  selected = false,
  ariaLabel,
  className = "",
  style,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  trailing?: ReactNode;
  accessory?: Accessory;
  onClick?: () => void;
  destructive?: boolean;
  selected?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const sepInset = leading ? 56 : 16;
  const content = (
    <>
      {leading ? <span className="flex shrink-0 items-center">{leading}</span> : null}
      <span className="min-w-0 flex-1">
        <span
          className={cx(
            "block truncate text-body",
            destructive
              ? "font-medium text-danger"
              : selected
                ? "font-semibold text-indigo"
                : "font-medium text-ink",
          )}
        >
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-caption text-muted">{subtitle}</span>
        ) : null}
      </span>
      {value ? <span className="shrink-0 text-caption text-muted">{value}</span> : null}
      {trailing}
      {accessory === "chevron" && !trailing ? <TrailingChevron /> : null}
      {accessory === "check" && !trailing ? <Checkmark on={selected} /> : null}
    </>
  );

  const base = cx("u-sep flex w-full items-center gap-3 px-4 py-3 text-left", className);
  if (onClick) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        style={{ ["--sep-inset" as string]: `${sepInset}px`, ...style }}
        className={cx(base, "transition-colors hover:bg-tint/45 active:bg-tint/70")}
      >
        {content}
      </button>
    );
  }
  return (
    <div style={{ ["--sep-inset" as string]: `${sepInset}px`, ...style }} className={base}>
      {content}
    </div>
  );
}

/** 卡片内的蓝色文字动作行 */
export function ActionRow({
  children,
  onClick,
  destructive = false,
  icon,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  destructive?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "u-sep u-press flex min-h-11 w-full items-center justify-center gap-2 px-4 py-3 text-body font-semibold disabled:opacity-35",
        destructive ? "text-danger" : "text-indigo",
      )}
      style={{ ["--sep-inset" as string]: "0px" }}
    >
      {icon}
      {children}
    </button>
  );
}

export function TrailingChevron() {
  return <ChevronRight size={17} className="shrink-0 text-muted/70" />;
}

/** 单选行右侧的蓝色对勾 */
export function Checkmark({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path
        d="M5 12.6l4.4 4.4L19 7.4"
        fill="none"
        stroke={color.accent}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Badge({
  children,
  tone = "gray",
  className = "",
}: {
  children: ReactNode;
  tone?: "gray" | "outline" | "accent" | "lake" | "gold" | "ink" | "danger";
  className?: string;
}) {
  const tones = {
    gray: "bg-hair/60 text-ink-soft",
    outline: "border border-hair text-muted",
    accent: "bg-tint text-indigo",
    lake: "bg-lake-tint text-lake-deep",
    gold: "bg-[#FFF1E0] text-[#B25000]",
    ink: "bg-ink text-card",
    danger: "bg-danger-tint text-danger",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Data display                                                         */
/* ------------------------------------------------------------------ */
export function Stat({
  value,
  label,
  unit,
  tone = "ink",
  className = "",
}: {
  value: ReactNode;
  label: ReactNode;
  unit?: string;
  tone?: "ink" | "accent" | "lake";
  className?: string;
}) {
  return (
    <div className={cx("min-w-0 text-center", className)}>
      <div
        className={cx(
          "u-num text-[24px] font-semibold leading-none",
          tone === "accent" && "text-indigo",
          tone === "lake" && "text-lake-deep",
        )}
      >
        {value}
        {unit ? <span className="text-caption text-muted">{unit}</span> : null}
      </div>
      <div className="mt-1.5 truncate text-[11px] text-muted">{label}</div>
    </div>
  );
}

export function Skeleton({
  className = "",
  rounded = "rounded-control",
}: {
  className?: string;
  rounded?: string;
}) {
  return <div aria-hidden className={cx("animate-pulse bg-hair/70", rounded, className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  actions,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hair bg-card/60 px-6 py-10 text-center">
      {icon ? (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tint text-indigo">
          {icon}
        </span>
      ) : null}
      <Body className="font-semibold">{title}</Body>
      {description ? (
        <Caption className="max-w-[26ch] leading-relaxed">{description}</Caption>
      ) : null}
      {action || actions ? (
        <div className="mt-1 flex flex-wrap justify-center gap-2">{action ?? actions}</div>
      ) : null}
    </div>
  );
}

/** 打卡热力图：数据驱动，点击跳到那天 */
export function Heatmap({
  values,
  days,
  selected,
  onSelect,
  weekdayLabels = ["一", "二", "三", "四", "五", "六", "日"],
}: {
  values: number[];
  days?: string[];
  selected?: string;
  onSelect?: (day: string) => void;
  weekdayLabels?: string[];
}) {
  return (
    <div>
      <div className="flex gap-1.5">
        {weekdayLabels.map((d) => (
          <span key={d} className="flex-1 text-center text-[10px] text-muted">
            {d}
          </span>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {values.map((value, index) => {
          const day = days?.[index];
          const isCurrent = day === selected;
          return (
            <motion.button
              key={day ?? index}
              type="button"
              disabled={!day || !onSelect}
              onClick={() => day && onSelect?.(day)}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={onSelect ? { scale: 0.86 } : undefined}
              transition={{ delay: index * 0.012, duration: 0.25, ease: "easeOut" }}
              title={day ? `${day} · ${value} 餐` : `${value} 餐`}
              aria-label={day ? `${day}，记录 ${value} 餐` : `记录 ${value} 餐`}
              className={cx(
                "aspect-square rounded-[6px] disabled:cursor-default",
                isCurrent && "ring-2 ring-indigo/80 ring-offset-1 ring-offset-white",
              )}
              style={{
                background:
                  value === 0
                    ? color.hair
                    : value === 1
                      ? "color-mix(in oklab, #007AFF 28%, transparent)"
                      : value === 2
                        ? "color-mix(in oklab, #007AFF 56%, transparent)"
                        : color.accent,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function HeatmapLegend({ from = "少", to = "多" }: { from?: string; to?: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted">
      {from}
      {[color.hair, "rgba(0,122,255,.28)", "rgba(0,122,255,.56)", color.accent].map((c) => (
        <span key={c} className="h-2.5 w-2.5 rounded-[3px]" style={{ background: c }} />
      ))}
      {to}
    </span>
  );
}
