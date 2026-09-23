import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/app/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_EMAIL } from "@/lib/content";
import { safeNext } from "@/lib/safe-next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "登录 · daily +" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  // 演示身份仍可打开登录页，以便切换到私人账号；私人账号则直接进入应用。
  const user = await getCurrentUser();
  if (sp.preview !== "1" && user && user.email !== DEMO_EMAIL) redirect(next);
  return <LoginForm next={next} />;
}
