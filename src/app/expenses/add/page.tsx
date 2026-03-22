"use client";

import { useEffect, useState } from "react";

import { ExpenseForm } from "@/components/expense-form";
import { syncProfileFromSession } from "@/lib/auth";
import { createExpense } from "@/lib/expenses";
import { toErrorMessage } from "@/lib/errors";
import { fetchMyPayerProfile } from "@/lib/payer-names";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { ExpenseInput } from "@/lib/types";

export default function ExpenseAddPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fixedPayer, setFixedPayer] = useState<{ value: "ME" | "SISTER"; label: string } | null>(
    null,
  );
  const [payerReady, setPayerReady] = useState(false);
  const [payerError, setPayerError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadPayerInfo() {
      try {
        await syncProfileFromSession();
        const myProfile = await fetchMyPayerProfile();
        if (mounted) {
          setFixedPayer({
            value: myProfile.payerCode,
            label: myProfile.displayName,
          });
          setPayerError(null);
          setPayerReady(true);
        }
      } catch (error) {
        if (mounted) {
          setPayerReady(true);
          setPayerError(toErrorMessage(error, "支払者プロフィールの取得に失敗しました。"));
        }
      }
    }
    void loadPayerInfo();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleCreate(values: ExpenseInput) {
    if (!isSupabaseConfigured) {
      throw new Error("Supabaseの環境変数が未設定です。");
    }

    await createExpense(values);
    setSuccessMessage("保存しました。続けて入力できます。");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">支出を追加</h2>
        <p className="mt-1 text-sm text-slate-500">日付・金額・カテゴリ・支払者を入力してください。</p>
      </section>

      {successMessage && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{successMessage}</p>}
      {!payerReady ? (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">支払者情報を読み込み中...</p>
      ) : fixedPayer ? (
        <ExpenseForm
          submitLabel="保存する"
          onSubmit={handleCreate}
          fixedPayer={fixedPayer}
        />
      ) : (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          {payerError ?? "支払者プロフィールが未設定です。"}
        </p>
      )}
    </div>
  );
}
