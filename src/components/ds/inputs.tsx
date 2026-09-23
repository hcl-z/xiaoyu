"use client";

import type { ReactNode } from "react";
import { Search, X } from "lucide-react";

function cx(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** 卡片内的一行表单：左标签 + 右控件 */
export function FieldRow({
  label,
  hint,
  children,
  align = "right",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  align?: "right" | "left";
}) {
  return (
    <div className="flex min-h-11 items-center gap-3 px-4 py-3">
      <span className="w-16 shrink-0 text-body text-muted">{label}</span>
      <div className={cx("min-w-0 flex-1", align === "right" && "flex justify-end")}>{children}</div>
      {hint ? <span className="text-caption text-muted/80">{hint}</span> : null}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  align = "right",
  inputMode,
  autoFocus,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  align?: "right" | "left";
  inputMode?: "text" | "numeric" | "decimal";
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <input
      value={value}
      inputMode={inputMode}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cx(
        "w-full min-w-0 bg-transparent text-body text-ink outline-none placeholder:text-muted/70",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full resize-none bg-transparent text-body leading-relaxed text-ink outline-none placeholder:text-muted/70"
    />
  );
}

/** 搜索框：白卡药丸 + 发丝描边 */
export function SearchField({
  value,
  onChange,
  placeholder = "搜索",
  onSubmit,
  autoFocus,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex items-center gap-2 rounded-full border border-hair bg-card px-3.5 py-2.5 transition-colors focus-within:border-indigo/50",
        className,
      )}
    >
      <Search size={15} className="shrink-0 text-muted" />
      <input
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit?.();
        }}
        placeholder={placeholder}
        className="w-full min-w-0 bg-transparent text-body outline-none placeholder:text-muted/80"
      />
      {value ? (
        <button type="button" aria-label="清除" onClick={() => onChange("")} className="shrink-0">
          <X size={14} className="text-muted" />
        </button>
      ) : null}
    </div>
  );
}
