"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "ホーム", match: (path: string) => path === "/" },
  {
    href: "/expenses/add",
    label: "追加",
    match: (path: string) => path === "/expenses/add",
  },
  { href: "/expenses", label: "支出一覧", match: (path: string) => path === "/expenses" },
  {
    href: "/settlement",
    label: "精算",
    match: (path: string) => path === "/settlement",
  },
  {
    href: "/settings",
    label: "設定",
    match: (path: string) => path === "/settings",
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl border-t border-slate-200 bg-white/95 backdrop-blur">
      <ul className="grid grid-cols-5">
        {links.map((link) => {
          const active = link.match(pathname);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex h-14 items-center justify-center text-xs font-semibold transition ${
                  active ? "text-teal-700" : "text-slate-500"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
