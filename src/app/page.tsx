"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MonthPicker } from "@/components/month-picker";
import { fetchExpensesByMonth } from "@/lib/expenses";
import { toErrorMessage } from "@/lib/errors";
import { formatYen, payerLabel } from "@/lib/format";
import {
  defaultPayerNameMap,
  fetchPayerNameMap,
  type PayerNameMap,
} from "@/lib/payer-names";
import { calculateSettlement } from "@/lib/settlement";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Expense } from "@/lib/types";
import { getCurrentMonth } from "@/lib/date";

export default function DashboardPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      const [rows, nameMap] = await Promise.all([
        fetchExpensesByMonth(month),
        fetchPayerNameMap().catch(() => defaultPayerNameMap),
      ]);
      setExpenses(rows);
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

  const monthlyTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  const paidMe = useMemo(
    () => expenses.filter((expense) => expense.payer === "ME").reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  const paidSister = useMemo(
    () => expenses.filter((expense) => expense.payer === "SISTER").reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  const settlement = useMemo(() => calculateSettlement(expenses), [expenses]);

  return (
    <div className="space-y-4">
      <section className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <MonthPicker value={month} onChange={setMonth} />
        <Link
          href="/expenses/add"
          className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white"
        >
          支出を追加
        </Link>
      </section>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">今月の合計</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatYen(monthlyTotal)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">精算対象の1人あたり負担額</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatYen(settlement.perPerson)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">{payerLabel("ME", payerNameMap)}の支払額</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatYen(paidMe)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">{payerLabel("SISTER", payerNameMap)}の支払額</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatYen(paidSister)}</p>
        </article>
      </section>

      <section className="rounded-xl border border-teal-200 bg-teal-50 p-4 shadow-sm">
        <p className="text-xs font-semibold text-teal-700">今月の精算結果</p>
        <p className="mt-2 text-lg font-bold text-teal-900">
          {settlement.transferAmount === 0
            ? "精算は不要です"
            : `${payerLabel(settlement.from, payerNameMap)} → ${payerLabel(settlement.to, payerNameMap)} に ${formatYen(settlement.transferAmount)}`}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">最近の支出</h2>
          <Link href="/expenses" className="text-sm font-semibold text-teal-700">
            すべて見る
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">読み込み中...</p>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-slate-500">この月の支出はまだありません。</p>
        ) : (
          <ul className="space-y-2">
            {expenses.slice(0, 5).map((expense) => (
              <li key={expense.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{expense.category}</p>
                  <p className="text-sm font-bold text-slate-900">{formatYen(expense.amount)}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {expense.expense_date} / {payerLabel(expense.payer, payerNameMap)}
                  {expense.is_settlement_target ? " / 精算対象" : " / 精算対象外"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
