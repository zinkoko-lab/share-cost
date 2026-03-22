"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ExpenseForm } from "@/components/expense-form";
import { MonthPicker } from "@/components/month-picker";
import { syncProfileFromSession } from "@/lib/auth";
import { buildExpensesCsv, downloadCsv } from "@/lib/csv";
import { deleteExpense, fetchExpensesByMonth, updateExpense } from "@/lib/expenses";
import { getCurrentMonth } from "@/lib/date";
import { toErrorMessage } from "@/lib/errors";
import { formatYen, payerLabel } from "@/lib/format";
import { fetchMonthlySettlement } from "@/lib/monthly-settlements";
import {
  defaultPayerNameMap,
  fetchMyPayerProfile,
  fetchPayerNameMap,
  toPayerOptions,
  type PayerNameMap,
} from "@/lib/payer-names";
import { isSupabaseConfigured } from "@/lib/supabase";
import { toInputDate } from "@/lib/date";
import type { Expense, ExpenseInput } from "@/lib/types";

export default function ExpenseListPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [monthConfirmed, setMonthConfirmed] = useState(false);
  const [payerNameMap, setPayerNameMap] = useState<PayerNameMap>(defaultPayerNameMap);
  const [myPayer, setMyPayer] = useState<{ value: "ME" | "SISTER"; label: string } | null>(null);

  const loadExpenses = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError("Supabaseの環境変数が未設定です。READMEを確認して設定してください。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await syncProfileFromSession();
      const [rows, settlementRecord, nameMap, myProfile] = await Promise.all([
        fetchExpensesByMonth(month),
        fetchMonthlySettlement(month),
        fetchPayerNameMap().catch(() => defaultPayerNameMap),
        fetchMyPayerProfile().catch(() => null),
      ]);
      setExpenses(rows);
      setMonthConfirmed(Boolean(settlementRecord?.is_confirmed));
      setPayerNameMap(nameMap);
      if (myProfile) {
        setMyPayer({
          value: myProfile.payerCode,
          label: myProfile.displayName,
        });
      }
    } catch (e) {
      setError(toErrorMessage(e, "データ取得に失敗しました。"));
    } finally {
      setLoading(false);
    }
  }, [month]);

  function handleExportCsv() {
    if (expenses.length === 0) {
      setError("出力対象の支出がありません。");
      return;
    }
    const contentWithNames = buildExpensesCsv(expenses, payerNameMap);
    downloadCsv(`expenses-${month}.csv`, contentWithNames);
  }

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  async function handleDelete(id: string) {
    const ok = window.confirm("この支出を削除しますか？");
    if (!ok) return;

    try {
      await deleteExpense(id);
      await loadExpenses();
    } catch (e) {
      setError(toErrorMessage(e, "支出の削除に失敗しました。"));
    }
  }

  async function handleUpdate(id: string, values: ExpenseInput) {
    try {
      await updateExpense(id, values);
      setEditingId(null);
      await loadExpenses();
    } catch (e) {
      setError(toErrorMessage(e, "支出の更新に失敗しました。"));
    }
  }

  const monthlyTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  return (
    <div className="space-y-4">
      <section className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <MonthPicker value={month} onChange={setMonth} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            CSV出力
          </button>
          <p className="text-sm font-semibold text-slate-700">合計: {formatYen(monthlyTotal)}</p>
        </div>
      </section>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {monthConfirmed && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          {month} は精算確定済みのため、編集・削除はできません。
        </p>
      )}

      <section className="space-y-3">
        {loading ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">読み込み中...</p>
        ) : expenses.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">この月の支出はありません。</p>
        ) : (
          expenses.map((expense) => (
            <article key={expense.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {editingId === expense.id ? (
                <ExpenseForm
                  submitLabel="更新する"
                  initialValues={{
                    expense_date: toInputDate(expense.expense_date),
                    amount: expense.amount,
                    category: expense.category,
                    payer: expense.payer,
                    memo: expense.memo ?? "",
                    is_settlement_target: expense.is_settlement_target,
                  }}
                  payerOptions={toPayerOptions(payerNameMap)}
                  fixedPayer={myPayer ?? undefined}
                  onSubmit={(values) => handleUpdate(expense.id, values)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-800">{expense.category}</h3>
                    <p className="text-lg font-bold text-slate-900">{formatYen(expense.amount)}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {expense.expense_date} / {payerLabel(expense.payer, payerNameMap)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {expense.memo?.trim() ? expense.memo : "メモなし"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {expense.is_settlement_target ? "精算対象" : "精算対象外"}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(expense.id)}
                      disabled={monthConfirmed}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(expense.id)}
                      disabled={monthConfirmed}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                    >
                      削除
                    </button>
                  </div>
                </>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
