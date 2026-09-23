"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/ds";

const LINKS = [
  { href: "/#lab", label: "交互原型" },
  { href: "/#screens", label: "全部页面" },
  { href: "/#map", label: "路由图" },
  { href: "/design-system", label: "设计系统" },
  { href: "/#routes", label: "路由表" },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="u-glass sticky top-0 z-50 border-b border-hair/70">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="text-[21px]">
          <Wordmark />
        </Link>
        <nav className="ml-auto hidden items-center gap-6 text-[13.5px] text-muted md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`transition-colors hover:text-indigo ${
                pathname === l.href ? "text-indigo" : ""
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href="/today"
          className="ml-auto rounded-full bg-indigo px-4 py-2 text-[13px] font-semibold text-card shadow-lift transition-transform active:scale-95 md:ml-0"
        >
          打开应用
        </a>
      </div>
    </header>
  );
}
