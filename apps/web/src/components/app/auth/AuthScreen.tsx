"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { Body, Caption, Display, NavBar } from "@/components/ds";
import { BowlMark } from "./BowlMark";

/**
 * 登录 / 注册共用骨架：导航条 → 品牌区 → 表单 → 错误 → 底部操作。
 * 三个入口共享同一套间距与层级，避免各写一套导致风格漂移。
 */
export function AuthScreen({
  title,
  description,
  backTo = "/welcome",
  actionLabel,
  onAction,
  error,
  children,
  footer,
  onSubmit,
}: {
  title: string;
  description: string;
  backTo?: string;
  /** 导航条右侧的互换入口（登录 ↔ 注册） */
  actionLabel: string;
  onAction: () => void;
  error?: string;
  children: ReactNode;
  footer: ReactNode;
  onSubmit: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col">
      <NavBar
        variant="compact"
        transparent
        sticky={false}
        onBack={() => router.push(backTo)}
        backLabel="返回"
        trailing={
          <button
            type="button"
            onClick={onAction}
            className="px-2 py-1 text-[15px] font-medium text-indigo transition-opacity active:opacity-50"
          >
            {actionLabel}
          </button>
        }
      />

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="flex flex-1 flex-col px-6 pb-10"
      >
        <header className="pt-1">
          <BowlMark className="h-12 w-14" />
          <Display as="h1" className="mt-4">
            {title}
          </Display>
          <Body tone="muted" className="mt-2 max-w-[19rem] leading-[1.7]">
            {description}
          </Body>
        </header>

        <div className="mt-6">{children}</div>

        {error ? (
          <div role="alert" className="mt-3 flex items-start gap-2 px-1">
            <CircleAlert size={15} className="mt-[3px] shrink-0 text-danger" />
            <Caption tone="danger" className="leading-relaxed">
              {error}
            </Caption>
          </div>
        ) : null}

        {/* 键盘上的「前往 / 回车」也能提交 */}
        <input type="submit" tabIndex={-1} aria-hidden className="sr-only" />

        <div className="mt-8">{footer}</div>
      </form>
    </div>
  );
}
