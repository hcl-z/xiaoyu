"use client";

import { motion, useReducedMotion } from "framer-motion";
import { color, motion as mt } from "@/design/tokens";

/** 品牌插画：一只碗与三缕热气。纯矢量，欢迎 / 登录 / 注册共用，保证启动流程视觉一致 */
export function BowlMark({
  className = "h-24 w-28",
  animated = true,
}: {
  className?: string;
  animated?: boolean;
}) {
  const reduce = useReducedMotion();
  const still = Boolean(reduce) || !animated;

  return (
    <svg viewBox="0 0 140 118" className={className} aria-hidden>
      <motion.path
        d="M22 62 H118 A48 48 0 0 1 22 62 Z"
        fill="none"
        stroke={color.ink}
        strokeWidth="2.4"
        strokeLinecap="round"
        initial={still ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: mt.ease }}
      />
      <path d="M14 62 H126" stroke={color.ink} strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M40 74 H100"
        stroke={color.accent}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="3 7"
      />
      {[46, 70, 94].map((x, i) => (
        <motion.path
          key={x}
          d={`M${x} 50 C ${x - 7} 40, ${x + 7} 34, ${x} 24`}
          fill="none"
          stroke={color.lake}
          strokeWidth="2.2"
          strokeLinecap="round"
          initial={still ? false : { opacity: 0, y: 8 }}
          animate={still ? { opacity: 0.6 } : { opacity: [0, 0.85, 0], y: [8, -4, -12] }}
          transition={still ? undefined : { duration: 3, repeat: Infinity, delay: i * 0.45 }}
        />
      ))}
      <motion.circle
        cx="112"
        cy="26"
        r="7"
        fill={color.accent}
        initial={still ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7, ...mt.spring.pop }}
      />
    </svg>
  );
}
