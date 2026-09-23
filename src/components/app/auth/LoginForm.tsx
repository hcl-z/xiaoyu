"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Body, Button, Caption, Section } from "@/components/ds";
import { AuthField } from "./AuthField";
import { AuthScreen } from "./AuthScreen";
import { finishAuth, postAuth } from "./auth-api";

/**
 * 当前预览环境默认免验证进入公共演示空间；点击「登录」直接前往主页，
 * 不检查输入、不等待 Cookie。私人账号仍可主动展开邮箱密码表单。
 */
export function LoginForm({ next }: { next: string }) {
  const [personal, setPersonal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const query = next === "/today" ? "" : `?next=${encodeURIComponent(next)}`;
  const canSignIn = Boolean(email.trim() && password) && !pending;

  const enterHome = () => {
    // 无论 Cookie 是否被预览环境接受，应用都会打开公共演示空间。
    // 整页 replace 可清空上一个账号的客户端内存缓存，也不会退回登录页。
    window.location.replace("/today");
  };

  const signInPersonal = async () => {
    if (!canSignIn) {
      setError("请输入邮箱和密码；也可以返回免验证入口直接进入主页");
      return;
    }
    setPending(true);
    setError("");
    const res = await postAuth("login", { email: email.trim(), password });
    if (res.ok) {
      const entered = await finishAuth(next);
      if (entered) return;
      setError("个人账号登录状态未保存。可先使用免验证入口浏览演示空间。");
    } else {
      setError(res.error);
    }
    setPending(false);
  };

  return (
    <AuthScreen
      title="欢迎回来"
      description={
        personal
          ? "使用你的个人账号继续管理私人菜谱与饮食记录。"
          : "当前环境可跳过账号校验，点击登录直接进入主页。"
      }
      actionLabel="注册"
      onAction={() => window.location.assign(`/register${query}`)}
      error={error}
      onSubmit={() => {
        if (personal) void signInPersonal();
        else enterHome();
      }}
      footer={
        personal ? (
          <>
            <Button
              size="lg"
              block
              disabled={pending}
              loading={pending}
              onClick={() => void signInPersonal()}
            >
              {pending ? "登录中…" : "使用个人账号登录"}
            </Button>
            <Button
              size="lg"
              variant="tonal"
              block
              className="mt-3"
              disabled={pending}
              onClick={() => {
                setPersonal(false);
                setError("");
              }}
            >
              返回免验证入口
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" block onClick={enterHome}>
              登录
              <ArrowRight size={16} strokeWidth={2} />
            </Button>
            <Button
              size="lg"
              variant="tonal"
              block
              className="mt-3"
              onClick={() => {
                setPersonal(true);
                setError("");
              }}
            >
              使用个人账号登录
            </Button>
            <Caption className="mt-3 block text-center leading-relaxed">
              免验证进入的是公共演示空间，请勿填写隐私信息
            </Caption>
          </>
        )
      }
    >
      {personal ? (
        <Section>
          <AuthField
            label="邮箱"
            type="email"
            inputMode="email"
            value={email}
            onChange={(value) => {
              setEmail(value);
              if (error) setError("");
            }}
            placeholder="name@example.com"
            autoComplete="username"
            autoFocus
            disabled={pending}
          />
          <AuthField
            label="密码"
            type="password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              if (error) setError("");
            }}
            placeholder="输入密码"
            autoComplete="current-password"
            revealable
            disabled={pending}
          />
        </Section>
      ) : (
        <Section>
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-tint text-indigo">
              <ArrowRight size={18} strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <Body as="span" className="block font-semibold">
                一键进入主页
              </Body>
              <Caption className="mt-0.5 block">
                无需密码 · 使用演示账号体验所有功能
              </Caption>
            </span>
          </div>
        </Section>
      )}
    </AuthScreen>
  );
}
