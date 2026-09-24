"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { PreparedPhoto } from "@/lib/photo";

/**
 * 照片打卡 —— 独立组件，不引用设计系统。
 *
 * 整个弹层只有一张拍立得卡片：左上角关闭、右上角保存。
 * 餐次由调用方按时间自动推断，界面上不再让用户选。
 */

/** 文案上限：拍立得白边写不下太多字 */
const CAPTION_MAX = 60;

export function PhotoCheckinPage({
  open,
  onClose,
  dayLabel,
  dateLine,
  caption,
  onCaptionChange,
  photo,
  busy,
  error,
  saved,
  canSave,
  onPick,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  dayLabel: string;
  dateLine: string;
  caption: string;
  onCaptionChange: (v: string) => void;
  photo: PreparedPhoto | null;
  busy: boolean;
  error: string;
  saved: boolean;
  canSave: boolean;
  onPick: () => void;
  onSave: () => void;
}) {
  const reduce = useReducedMotion();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  /** 选好图后自动把光标送进文案区，省一次点击 */
  useEffect(() => {
    if (!photo) return;
    const t = window.setTimeout(() => taRef.current?.focus(), 420);
    return () => window.clearTimeout(t);
  }, [photo]);

  if (typeof document === "undefined") return null;

  const spring = { type: "spring" as const, stiffness: 320, damping: 26 };
  const pop = { type: "spring" as const, stiffness: 420, damping: 18 };
  const remain = CAPTION_MAX - caption.length;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
          {/* 遮罩：点击空白关闭 */}
          <motion.button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-[#18181B]/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="照片打卡"
            className="relative w-full max-w-[268px]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.82, rotate: -12, y: 24 }}
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, rotate: writing ? -1 : -3.5, y: 0 }
            }
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, rotate: -8, y: 20 }}
            transition={spring}
          >
            {/* 两枚圆形按钮：压在卡片上缘两角 */}
            <motion.button
              type="button"
              aria-label="关闭"
              onClick={onClose}
              className="absolute -left-3 -top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#3F3F46] shadow-[0_4px_16px_rgba(0,0,0,0.18)]"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reduce ? { duration: 0.2 } : { ...pop, delay: 0.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </motion.button>

            <motion.button
              type="button"
              aria-label={busy ? "保存中" : "保存"}
              onClick={onSave}
              disabled={!canSave}
              className={`absolute -right-3 -top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-colors ${
                canSave ? "bg-[#18181B] text-white" : "bg-white text-[#D4D4D8]"
              }`}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reduce ? { duration: 0.2 } : { ...pop, delay: 0.16 }}
              whileTap={canSave ? { scale: 0.9 } : undefined}
            >
              {busy ? (
                <motion.span
                  className="block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.6l4.4 4.4L19 7.4" />
                </svg>
              )}
            </motion.button>

            {/* 拍立得本体 */}
            <div className="rounded-[8px] bg-white p-3.5 pb-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
              {photo ? (
                <button
                  type="button"
                  onClick={onPick}
                  aria-label="换一张照片"
                  className="group relative block aspect-square w-full overflow-hidden bg-[#E4E4E7]"
                >
                  {/* 显影动效：从偏暗低饱和渐变到正常 */}
                  <motion.img
                    key={photo.previewUrl}
                    src={photo.previewUrl}
                    alt="待保存的打卡照片"
                    className="h-full w-full object-cover"
                    initial={
                      reduce
                        ? { opacity: 0 }
                        : { opacity: 0, filter: "brightness(0.5) saturate(0.2)" }
                    }
                    animate={{ opacity: 1, filter: "brightness(1) saturate(1)" }}
                    transition={{ duration: reduce ? 0.2 : 1.1, ease: "easeOut" }}
                  />
                  <span className="absolute inset-x-0 bottom-0 flex justify-center pb-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded-full bg-[#18181B]/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                      换一张
                    </span>
                  </span>
                </button>
              ) : (
                <motion.button
                  type="button"
                  onClick={onPick}
                  disabled={busy}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-3 bg-[#F4F4F5] disabled:opacity-60"
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.span
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.1)]"
                    animate={reduce ? undefined : { y: [0, -4, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2a2 2 0 0 0 1.7-.95l.5-.8A2 2 0 0 1 10.6 3h2.8a2 2 0 0 1 1.7.95l.5.8A2 2 0 0 0 17.3 6h1.2A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-9Z" />
                      <circle cx="12" cy="13" r="3.6" />
                    </svg>
                  </motion.span>
                  <span className="text-[13.5px] font-semibold text-[#18181B]">
                    {busy ? "处理中…" : "拍照或选图"}
                  </span>
                </motion.button>
              )}

              {/* 文字记录：写在白边上，像在真照片背面写字 */}
              <div className="px-0.5 pt-3.5">
                <div className="relative">
                  <textarea
                    ref={taRef}
                    rows={2}
                    maxLength={CAPTION_MAX}
                    value={caption}
                    onChange={(e) => onCaptionChange(e.target.value)}
                    onFocus={() => setWriting(true)}
                    onBlur={() => setWriting(false)}
                    placeholder="写点什么…"
                    className="w-full resize-none bg-transparent text-center text-[14.5px] leading-[1.7] text-[#27272A] outline-none placeholder:text-[#C4C4CC]"
                  />
                  {/* 聚焦时浮现的书写引导线 */}
                  <motion.span
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-center bg-[#18181B]/15"
                    initial={false}
                    animate={{ scaleX: writing ? 1 : 0, opacity: writing ? 1 : 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10.5px] tracking-wide text-[#A1A1AA]">
                    {dateLine}
                  </span>
                  <AnimatePresence>
                    {writing && remain <= 20 ? (
                      <motion.span
                        className={`text-[10.5px] tabular-nums ${
                          remain <= 5 ? "text-[#DC2626]" : "text-[#A1A1AA]"
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {remain}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* 错误与压缩说明挂在卡片外，不挤占白边 */}
            <div className="mt-3 text-center">
              {error ? (
                <motion.p
                  className="text-[12.5px] text-[#FCA5A5]"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.p>
              ) : photo ? (
                <p className="text-[11.5px] text-white/60">
                  {photo.width > 0 ? `${photo.width}×${photo.height} · ` : ""}
                  {Math.max(1, Math.round(photo.file.size / 1024))} KB
                </p>
              ) : (
                <p className="text-[11.5px] text-white/60">上传前自动压缩，不存原图</p>
              )}
            </div>

            {/* 保存成功：卡片被「收走」 */}
            <AnimatePresence>
              {saved ? (
                <motion.div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 rounded-[8px] bg-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.span
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[#18181B]"
                    initial={reduce ? { opacity: 0 } : { scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={pop}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.6l4.4 4.4L19 7.4" />
                    </svg>
                  </motion.span>
                  <span className="text-[15px] font-semibold text-[#18181B]">
                    已记录到{dayLabel}
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
