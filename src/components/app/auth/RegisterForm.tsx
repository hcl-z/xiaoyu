"use client";

import { useState } from "react";
import { Button, Caption, CheckCircle, Section } from "@/components/ds";
import { AuthField } from "./AuthField";
import { AuthScreen } from "./AuthScreen";
import { finishAuth, postAuth } from "./auth-api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 与服务端 passwordProblem() 完全一致：界面上勾的就是真正生效的规则 */
const RULES = [
  { id: "length", label: "至少 8 个字符", test: (v: string) => v.length >= 8 && v.length <= 72 },
  {
    id: "mix",
    label: "同时包含字母和数字",
    test: (v: string) => /[A-Za-z]/.test(v) && /\d/.test(v),
  },
];

export function RegisterForm({ next }: { next: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const query = next === "/today" ? "" : `?next=${encodeURIComponent(next)}`;
  const emailValid = EMAIL_RE.test(email.trim());
  const rulesMet = RULES.every((rule) => rule.test(password));
  const canSubmit = name.trim().length > 0 && emailValid && rulesMet && !pending;
  const message =
    error || (emailTouched && email.trim() && !emailValid ? "请输入有效的邮箱地址" : "");

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (error) setError("");
  };

  const submit = async () => {
    if (!canSubmit) return;
    setPending(true);
    setError("");
    const res = await postAuth("register", {
      name: name.trim(),
      email: email.trim(),
      password,
    });
    if (res.ok) {
      const entered = await finishAuth(next);
      if (entered) return;
      setPending(false);
      setError("登录状态未能保存，请检查浏览器是否禁用了 Cookie");
      return;
    }
    setPending(false);
    setError(res.error);
  };

  return (
    <AuthScreen
      title="创建账号"
      description="注册后会准备 6 道入门菜谱，随时可以编辑或删除。"
      actionLabel="登录"
      onAction={() => window.location.assign(`/login${query}`)}
      error={message}
      onSubmit={() => void submit()}
      footer={
        <>
          <Button size="lg" block disabled={!canSubmit} loading={pending} onClick={() => void submit()}>
            {pending ? "创建中…" : "注册并开始"}
          </Button>
          <Caption className="mt-2.5 block text-center leading-relaxed">
            账号仅用于保存你的菜谱与饮食记录
          </Caption>
        </>
      }
    >
      <Section>
        <AuthField
          label="昵称"
          value={name}
          onChange={edit(setName)}
          placeholder="怎么称呼你"
          autoComplete="nickname"
          maxLength={20}
          autoFocus
          disabled={pending}
        />
        <AuthField
          label="邮箱"
          type="email"
          inputMode="email"
          value={email}
          onChange={edit(setEmail)}
          onBlur={() => setEmailTouched(true)}
          placeholder="name@example.com"
          autoComplete="email"
          disabled={pending}
        />
        <AuthField
          label="密码"
          type="password"
          value={password}
          onChange={edit(setPassword)}
          placeholder="设置密码"
          autoComplete="new-password"
          revealable
          disabled={pending}
        />
      </Section>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 px-1" aria-live="polite">
        {RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <span key={rule.id} className="flex items-center gap-1.5">
              <CheckCircle done={met} size={15} />
              <Caption tone={met ? "lake" : "muted"}>{rule.label}</Caption>
            </span>
          );
        })}
      </div>
    </AuthScreen>
  );
}
