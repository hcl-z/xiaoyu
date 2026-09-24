"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { color, motion as mt } from "@/design/tokens";

const EPS = [0.22, 0.61, 0.36, 1] as const;

/** 进度环 · 三餐完成度 */
export function Ring({
  pct,
  size = 132,
  stroke = 11,
  tone = color.accent,
  track = color.hair,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  tone?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - c * clamped }}
          transition={{ duration: 1.1, ease: EPS }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function Bar({
  pct,
  tone = color.accent,
  height = 6,
  className = "",
}: {
  pct: number;
  tone?: string;
  height?: number;
  className?: string;
}) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-hair/70 ${className}`} style={{ height }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: tone }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        transition={{ duration: 0.9, ease: EPS }}
      />
    </div>
  );
}

/** 带标签的计量行 */
export function MeterRow({
  label,
  value,
  max,
  unit = "g",
  tone = color.accent,
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
  tone?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[11.5px] text-muted">
        <span>{label}</span>
        <span className="u-num tabular-nums text-ink-soft">
          {value}/{max} {unit}
        </span>
      </div>
      <Bar pct={max ? (value / max) * 100 : 0} tone={tone} />
    </div>
  );
}

/** 迷你柱状 · 本周节奏 */
export function Sparkbars({
  values,
  labels,
  tone = color.accent,
  height = 40,
  highlightLast = false,
}: {
  values: number[];
  labels?: string[];
  tone?: string;
  height?: number;
  highlightLast?: boolean;
}) {
  const max = Math.max(...values, 1);
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {values.map((v, i) => {
          const last = highlightLast && i === values.length - 1;
          return (
            <motion.span
              key={i}
              className="flex-1 rounded-[3px]"
              style={{
                background: tone,
                opacity: last ? 1 : v === 0 ? 0.16 : 0.3 + (v / max) * 0.55,
              }}
              initial={{ height: 2 }}
              animate={{ height: `${Math.max(10, (v / max) * 100)}%` }}
              transition={{ duration: 0.5, delay: i * 0.03, ease: mt.ease }}
            />
          );
        })}
      </div>
      {labels ? (
        <div className="mt-1 flex gap-1">
          {labels.map((l, i) => (
            <span
              key={`${l}-${i}`}
              className={`flex-1 text-center text-[10px] ${
                highlightLast && i === labels.length - 1 ? "font-semibold text-indigo" : "text-muted"
              }`}
            >
              {l}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
