"use client";

import { useRouter } from "next/navigation";
import { BookOpen, CalendarCheck, User } from "lucide-react";
import { TabBar, type TabItem } from "@/components/ds";
import { icons } from "@/design/tokens";

const ITEMS: TabItem[] = [
  { value: "today", label: "今日", icon: <CalendarCheck size={icons.sizes.lg} /> },
  { value: "recipes", label: "菜谱", icon: <BookOpen size={icons.sizes.lg} /> },
  { value: "profile", label: "我的", icon: <User size={icons.sizes.lg} /> },
];

export function AppTabs({ active }: { active: string }) {
  const router = useRouter();
  const hrefs: Record<string, string> = {
    today: "/today",
    recipes: "/recipes",
    profile: "/profile",
  };
  return (
    <TabBar
      items={ITEMS}
      active={active}
      onSelect={(v) => router.push(hrefs[v] ?? "/today")}
    />
  );
}
