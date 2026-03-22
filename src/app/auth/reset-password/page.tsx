"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { toErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initRecoverySession() {
      if (!supabase) {
        setError("Supabaseの環境変数が未設定です。");
        setReady(true);
        return;
      }

      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (type === "recovery" && accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          if (mounted) {
            setError(toErrorMessage(sessionError, "再設定リンクが無効です。"));
            setReady(true);
          }
          return;
        }
      }

      if (mounted) setReady(true);
    }

    void initRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleResetPassword() {
    if (!supabase) {
      setError("Supabaseの環境変数が未設定です。");
      return;
    }

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }

    if (password !== passwordConfirm) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw updateError;
      }

      setMessage("パスワードを更新しました。ログイン画面へ移動します。");
      setTimeout(() => {
        router.replace("/auth");
      }, 1200);
    } catch (e) {
      setError(toErrorMessage(e, "パスワード更新に失敗しました。"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">パスワード再設定</h2>
        <p className="mt-1 text-sm text-slate-500">新しいパスワードを入力してください。</p>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {!ready ? (
          <p className="text-sm text-slate-500">再設定リンクを確認中...</p>
        ) : (
          <>
            <label className="block space-y-1">
              <span className="text-sm text-slate-600">新しいパスワード</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="8文字以上"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm text-slate-600">新しいパスワード（確認）</span>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="確認用パスワード"
              />
            </label>

            {message && <p className="text-sm text-emerald-700">{message}</p>}
            {error && <p className="text-sm text-rose-700">{error}</p>}

            <button
              type="button"
              onClick={() => void handleResetPassword()}
              disabled={loading}
              className="w-full rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              パスワードを更新する
            </button>
          </>
        )}
      </section>
    </div>
  );
}
