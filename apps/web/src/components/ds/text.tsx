import type { ElementType, ReactNode } from "react";

/**
 * Typography primitives — the only sanctioned way to set text.
 */
export type Tone =
  | "ink"
  | "soft"
  | "muted"
  | "accent"
  | "lake"
  | "danger"
  | "invert";

const TONE: Record<Tone, string> = {
  ink: "text-ink",
  soft: "text-ink-soft",
  muted: "text-muted",
  accent: "text-indigo",
  lake: "text-lake-deep",
  danger: "text-danger",
  invert: "text-card",
};

type Base = {
  children?: ReactNode;
  className?: string;
  as?: ElementType;
  tone?: Tone;
  tabular?: boolean;
};

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(" ");
}

function classes(base: Base, own: string) {
  return cx(own, TONE[base.tone ?? "ink"], base.tabular && "u-num", base.className);
}

/** 38 / 40 · tabular · 大数值 */
export function Metric({ as, children, ...b }: Base) {
  const Tag = (as ?? "span") as ElementType;
  return <Tag className={classes(b, "u-num text-metric font-semibold")}>{children}</Tag>;
}

/** 30 / 36 · Large Title */
export function Display({ as, children, ...b }: Base) {
  const Tag = (as ?? "h1") as ElementType;
  return (
    <Tag className={classes(b, "font-display text-display font-semibold tracking-tight")}>
      {children}
    </Tag>
  );
}

/** 25 / 32 · 页面标题 / 菜名 */
export function Title({ as, children, ...b }: Base) {
  const Tag = (as ?? "h2") as ElementType;
  return (
    <Tag className={classes(b, "font-display text-title font-semibold tracking-tight")}>
      {children}
    </Tag>
  );
}

/** 18 / 25 · 区块标题 */
export function Subhead({ as, children, ...b }: Base) {
  const Tag = (as ?? "h3") as ElementType;
  return (
    <Tag className={classes(b, "font-display text-subhead font-semibold tracking-tight")}>
      {children}
    </Tag>
  );
}

/** 15 / 22 · 正文 */
export function Body({ as, children, ...b }: Base) {
  const Tag = (as ?? "p") as ElementType;
  return <Tag className={classes(b, "text-body font-medium")}>{children}</Tag>;
}

/** 13 / 19 · 说明 */
export function Caption({ as, children, ...b }: Base) {
  const Tag = (as ?? "span") as ElementType;
  return <Tag className={classes({ tone: "muted", ...b }, "text-caption")}>{children}</Tag>;
}

/** 11 / 14 · 0.22em 加宽字距小标签 */
export function Micro({ as, children, cn = false, ...b }: Base & { cn?: boolean }) {
  const Tag = (as ?? "span") as ElementType;
  return (
    <Tag
      className={classes(
        { tone: "muted", ...b },
        cn ? "text-[11px] font-medium tracking-[0.3em]" : "text-micro font-semibold uppercase",
      )}
    >
      {children}
    </Tag>
  );
}

/** 柔和的编辑性文本（次级段落） */
export function Editorial({ as, children, ...b }: Base) {
  const Tag = (as ?? "span") as ElementType;
  return <Tag className={classes({ tone: "soft", ...b }, "text-body leading-relaxed")}>{children}</Tag>;
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={cx("font-display font-bold tracking-tight", className)}>
      daily<span className="text-indigo">+</span>
    </span>
  );
}
