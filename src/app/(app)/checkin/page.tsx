import { redirect } from "next/navigation";

/**
 * /checkin 保留为深链入口：重定向到今日页并自动展开打卡弹层。
 * 弹层本身由 CheckinProvider 在当前页面就地呈现，不再是独立页面。
 */
export default async function CheckinRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams({ checkin: "1" });
  if (typeof sp.meal === "string") q.set("meal", sp.meal);
  if (typeof sp.recipe === "string") q.set("recipe", sp.recipe);
  redirect(`/today?${q.toString()}`);
}
