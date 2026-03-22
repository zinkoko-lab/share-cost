"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setEmail(data.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!email) {
    return (
      <Link href="/auth" className="text-xs font-semibold text-teal-700">
        ログイン
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="max-w-28 truncate text-xs text-slate-500" title={email}>
        {email}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-xs font-semibold text-slate-600"
      >
        ログアウト
      </button>
    </div>
  );
}
