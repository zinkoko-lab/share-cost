import type { Metadata } from "next";

import { AuthGate } from "@/components/auth-gate";
import { AuthStatus } from "@/components/auth-status";
import { BottomNav } from "@/components/bottom-nav";

import "./globals.css";

export const metadata: Metadata = {
  title: "ShareCost | 共同生活費管理",
  description: "2人暮らし向けの共同生活費管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <div className="mx-auto min-h-screen w-full max-w-3xl bg-slate-50">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-800">ShareCost</h1>
                <p className="text-xs text-slate-500">共同生活費管理アプリ</p>
              </div>
              <AuthStatus />
            </div>
          </header>
          <main className="px-4 py-4 pb-24">
            <AuthGate>{children}</AuthGate>
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
