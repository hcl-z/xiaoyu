"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * 表单行：几何、字号、颜色与 ds 的 FieldRow + TextInput 完全一致，
 * 额外补足登录表单需要的原生能力（type / autoComplete / 显示密码）。
 */
const INPUT_CLS =
  "w-full min-w-0 bg-transparent text-body text-ink outline-none placeholder:text-muted/70 disabled:opacity-60";

export function AuthField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  autoFocus = false,
  revealable = false,
  disabled = false,
  inputMode,
  maxLength,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  revealable?: boolean;
  disabled?: boolean;
  inputMode?: "text" | "email";
  maxLength?: number;
  onBlur?: () => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!autoFocus) return;
    // 嵌在展示台预览里时不抢焦点，避免外层页面跳动
    if (window.self !== window.top) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  return (
    <div className="u-sep flex min-h-11 items-center gap-3 px-4 py-3">
      <label htmlFor={id} className="w-16 shrink-0 text-body text-muted">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type={revealable && revealed ? "text" : type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        inputMode={inputMode}
        maxLength={maxLength}
        autoCapitalize={type === "text" ? "sentences" : "none"}
        autoCorrect="off"
        spellCheck={false}
        className={INPUT_CLS}
      />
      {revealable ? (
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? "隐藏密码" : "显示密码"}
          aria-pressed={revealed}
          className="-my-1 -mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-indigo active:opacity-60"
        >
          {revealed ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      ) : null}
    </div>
  );
}
