"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { requestPasswordReset, signIn, signUp } from "@/lib/auth";
import { toErrorMessage } from "@/lib/errors";

export default function AuthPage() {
  const router = useRouter();
  const RESET_COOLDOWN_SECONDS = 60;
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    if (resetCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResetCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resetCooldown]);

  async function handleSignIn() {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await signIn(email, password);
      setMessage("ログインしました。");
      router.push("/");
    } catch (e) {
      setError(toErrorMessage(e, "ログインに失敗しました。"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const result = await signUp(email, password, { displayName });
      if (result.emailConfirmationRequired) {
        setMessage("登録しました。確認メールの承認後にログインしてください。");
      } else {
        setMessage("登録しました。ログイン状態で利用できます。");
      }
    } catch (e) {
      setError(toErrorMessage(e, "登録に失敗しました。"));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (resetCooldown > 0) return;

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await requestPasswordReset(email);
      setMessage("パスワード再設定メールを送信しました。メールを確認してください。");
      setResetCooldown(RESET_COOLDOWN_SECONDS);
    } catch (e) {
      setError(toErrorMessage(e, "再設定メールの送信に失敗しました。"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">
          {mode === "login" ? "ログイン" : "新規登録"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "login"
            ? "メールアドレスとパスワードでログインしてください。"
            : "利用するメールアドレスでアカウントを作成してください。"}
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block space-y-1">
          <span className="text-sm text-slate-600">メールアドレス</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="zkk@example.com"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-slate-600">パスワード</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="8文字以上"
          />
        </label>

        {mode === "signup" && (
          <>
            <label className="block space-y-1">
              <span className="text-sm text-slate-600">支払者名（表示名）</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="例: たろう"
              />
            </label>
            <p className="text-xs text-slate-500">
              支払者区分は自動割り当てされます。入力は不要です。
            </p>
          </>
        )}

        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-rose-700">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void (mode === "login" ? handleSignIn() : handleSignUp())}
            disabled={loading}
            className="flex-1 rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {mode === "login" ? "ログイン" : "新規登録する"}
          </button>
        </div>

        <div className="space-y-1 text-sm">
          {mode === "login" ? (
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="font-semibold text-teal-700"
            >
              新規登録はこちら
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="font-semibold text-teal-700"
            >
              すでにアカウントをお持ちの方はこちら
            </button>
          )}
          <div>
            <button
              type="button"
              onClick={() => void handlePasswordReset()}
              disabled={loading || resetCooldown > 0}
              className="text-slate-600 underline underline-offset-2 disabled:no-underline disabled:opacity-60"
            >
              {resetCooldown > 0
                ? `パスワード再送まで ${resetCooldown}秒`
                : "パスワードを忘れた場合"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
