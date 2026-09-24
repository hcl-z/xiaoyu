import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/app/auth/RegisterForm";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_EMAIL } from "@/lib/content";
import { safeNext } from "@/lib/safe-next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "注册 · daily +" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  // 演示身份可以继续注册私人账号；私人账号已登录则直接返回应用。
  const user = await getCurrentUser();
  if (sp.preview !== "1" && user && user.email !== DEMO_EMAIL) redirect(next);
  return <RegisterForm next={next} />;
}
