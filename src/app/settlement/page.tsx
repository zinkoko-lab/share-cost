"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { MonthPicker } from "@/components/month-picker";
import { getCurrentMonth } from "@/lib/date";
import { fetchExpensesByMonth } from "@/lib/expenses";
import { toErrorMessage } from "@/lib/errors";
import { formatYen, payerLabel } from "@/lib/format";
import { fetchMonthlySettlement, setMonthlyConfirmed } from "@/lib/monthly-settlements";
import {
  defaultPayerNameMap,
  fetchPayerNameMap,
  type PayerNameMap,
} from "@/lib/payer-names";
import { calculateSettlement } from "@/lib/settlement";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Expense } from "@/lib/types";

export default function SettlementPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthConfirmed, setMonthConfirmed] = useState(false);
  const [payerNameMap, setPayerNameMap] = useState<PayerNameMap>(defaultPayerNameMap);

  const loadExpenses = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError("Supabaseの環境変数が未設定です。READMEを確認して設定してください。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [rows, settlementRecord, nameMap] = await Promise.all([
        fetchExpensesByMonth(month),
        fetchMonthlySettlement(month),
        fetchPayerNameMap().catch(() => defaultPayerNameMap),
      ]);
      setExpenses(rows);
      setMonthConfirmed(Boolean(settlementRecord?.is_confirmed));
      setPayerNameMap(nameMap);
    } catch (e) {
      setError(toErrorMessage(e, "データ取得に失敗しました。"));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const settlement = useMemo(() => calculateSettlement(expenses), [expenses]);

  async function toggleConfirm() {
    try {
      setError(null);
      await setMonthlyConfirmed(month, !monthConfirmed);
      await loadExpenses();
    } catch (e) {
      setError(toErrorMessage(e, "精算確定状態の更新に失敗しました。"));
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <MonthPicker value={month} onChange={setMonth} />
        </div>
      </section>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">月次精算結果</h2>
          <button
            type="button"
            onClick={() => void toggleConfirm()}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              monthConfirmed
                ? "border border-amber-300 bg-amber-50 text-amber-700"
                : "bg-teal-600 text-white"
            }`}
          >
            {monthConfirmed ? "確定を解除" : "この月を確定"}
          </button>
        </div>

        {loading ? (
          <p className="mt-3 text-sm text-slate-500">読み込み中...</p>
        ) : (
          <>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">精算対象合計</dt>
                <dd className="font-semibold text-slate-800">{formatYen(settlement.totalTarget)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">{payerLabel("ME", payerNameMap)}の支払額（精算対象）</dt>
                <dd className="font-semibold text-slate-800">{formatYen(settlement.paidMe)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">{payerLabel("SISTER", payerNameMap)}の支払額（精算対象）</dt>
                <dd className="font-semibold text-slate-800">{formatYen(settlement.paidSister)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">1人あたり負担額</dt>
                <dd className="font-semibold text-slate-800">{formatYen(settlement.perPerson)}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-lg bg-teal-50 p-3">
              <p className="text-xs font-semibold text-teal-700">最終精算</p>
              <p className="mt-1 text-lg font-bold text-teal-900">
                {settlement.transferAmount === 0
                  ? "精算は不要です"
                  : `${payerLabel(settlement.from, payerNameMap)} が ${payerLabel(settlement.to, payerNameMap)} に ${formatYen(settlement.transferAmount)} 支払う`}
              </p>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              精算状態: {monthConfirmed ? "確定済み（編集ロック中）" : "未確定"}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
