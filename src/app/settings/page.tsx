"use client";

import { useState } from "react";
import { useEffect } from "react";

import { fetchMyPayerProfile } from "@/lib/payer-names";
import { toErrorMessage } from "@/lib/errors";
import { checkDatabaseHealth, type HealthCheckResult } from "@/lib/health";
import { upsertMyProfile } from "@/lib/auth";

export default function SettingsPage() {
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadMyProfile() {
      try {
        const myProfile = await fetchMyPayerProfile();
        if (mounted) {
          setDisplayName(myProfile.displayName);
          setProfileError(null);
        }
      } catch (e) {
        if (mounted) {
          setProfileError(toErrorMessage(e, "プロフィールの取得に失敗しました。"));
        }
      } finally {
        if (mounted) setProfileLoading(false);
      }
    }
    void loadMyProfile();
    return () => {
      mounted = false;
    };
  }, []);

  async function runCheck() {
    setLoading(true);
    const checked = await checkDatabaseHealth();
    setResult(checked);
    setLoading(false);
  }

  async function saveDisplayName() {
    try {
      setProfileMessage(null);
      setProfileError(null);
      await upsertMyProfile({ displayName });
      setProfileMessage("表示名を更新しました。");
    } catch (e) {
      setProfileError(toErrorMessage(e, "表示名の更新に失敗しました。"));
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">設定・接続確認</h2>
        <p className="mt-1 text-sm text-slate-500">
          Supabase接続と必要テーブルの状態を確認できます。
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700">支払者名（表示名）</h3>
        {profileLoading ? (
          <p className="mt-2 text-sm text-slate-500">読み込み中...</p>
        ) : (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="例: 太郎"
            />
            <button
              type="button"
              onClick={() => void saveDisplayName()}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
            >
              表示名を保存
            </button>
            {profileMessage && <p className="text-sm text-emerald-700">{profileMessage}</p>}
            {profileError && <p className="text-sm text-rose-700">{profileError}</p>}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => void runCheck()}
          disabled={loading}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "確認中..." : "DB接続チェック"}
        </button>

        {result && (
          <div className="mt-4 space-y-2 text-sm">
            <p className={result.ok ? "text-emerald-700" : "text-rose-700"}>{result.message}</p>
            <ul className="space-y-1 text-slate-600">
              <li>環境変数: {result.supabaseConfigured ? "OK" : "NG"}</li>
              <li>authセッション: {result.authSessionAvailable ? "あり" : "なし"}</li>
              <li>expensesテーブル: {result.expensesTableAccessible ? "OK" : "NG"}</li>
              <li>monthly_settlementsテーブル: {result.settlementsTableAccessible ? "OK" : "NG"}</li>
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
