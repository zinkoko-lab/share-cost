"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { syncProfileFromSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type AuthGateProps = {
  children: React.ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(() => !supabase);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      const isAuthPage = pathname === "/auth";
      const isResetPage = pathname === "/auth/reset-password";
      const isPublicAuthPage = isAuthPage || isResetPage;

      if (!data.session && !isPublicAuthPage) {
        router.replace("/auth");
      }

      if (data.session && isAuthPage) {
        router.replace("/");
      }
      if (data.session) {
        void syncProfileFromSession();
      }

      setChecked(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthPage = pathname === "/auth";
      const isResetPage = pathname === "/auth/reset-password";
      const isPublicAuthPage = isAuthPage || isResetPage;

      if (!session && !isPublicAuthPage) {
        router.replace("/auth");
      }
      if (session && isAuthPage) {
        router.replace("/");
      }
      if (session) {
        void syncProfileFromSession();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (!checked) {
    return <div className="p-4 text-sm text-slate-500">認証状態を確認中...</div>;
  }

  return <>{children}</>;
}
