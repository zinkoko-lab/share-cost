"use client";

import { type FormEvent, useEffect, useState } from "react";

import { CATEGORY_OPTIONS, PAYER_OPTIONS } from "@/lib/constants";
import { toErrorMessage } from "@/lib/errors";
import { expenseSchema } from "@/lib/validation";
import type { ExpenseInput } from "@/lib/types";

type ExpenseFormProps = {
  initialValues?: Partial<ExpenseInput>;
  submitLabel: string;
  onSubmit: (values: ExpenseInput) => Promise<void>;
  onCancel?: () => void;
  payerOptions?: ReadonlyArray<{ value: "ME" | "SISTER"; label: string }>;
  fixedPayer?: { value: "ME" | "SISTER"; label: string };
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  payerOptions = PAYER_OPTIONS,
  fixedPayer,
}: ExpenseFormProps) {
  const [expenseDate, setExpenseDate] = useState(initialValues?.expense_date ?? todayString());
  const [amount, setAmount] = useState(String(initialValues?.amount ?? ""));
  const [category, setCategory] = useState(initialValues?.category ?? CATEGORY_OPTIONS[0]);
  const [payer, setPayer] = useState<"ME" | "SISTER">(
    fixedPayer?.value ?? initialValues?.payer ?? "ME",
  );
  const [memo, setMemo] = useState(initialValues?.memo ?? "");
  const [isSettlementTarget, setIsSettlementTarget] = useState(
    initialValues?.is_settlement_target ?? true,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (fixedPayer) setPayer(fixedPayer.value);
  }, [fixedPayer]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = expenseSchema.safeParse({
      expense_date: expenseDate,
      amount,
      category,
      payer,
      memo,
      is_settlement_target: isSettlementTarget,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      setFormError(null);
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});
      setFormError(null);
      await onSubmit(parsed.data);
    } catch (error) {
      setFormError(toErrorMessage(error, "保存に失敗しました。"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">日付</label>
        <input
          type="date"
          value={expenseDate}
          onChange={(event) => setExpenseDate(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        {errors.expense_date && <p className="text-xs text-rose-600">{errors.expense_date}</p>}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">金額</label>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="例: 2500"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        {errors.amount && <p className="text-xs text-rose-600">{errors.amount}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">カテゴリ</label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as ExpenseInput["category"])}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {CATEGORY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">支払者</label>
          {fixedPayer ? (
            <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {fixedPayer.label}
            </div>
          ) : (
            <select
              value={payer}
              onChange={(event) => setPayer(event.target.value as "ME" | "SISTER")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {payerOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">メモ</label>
        <textarea
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          maxLength={120}
          rows={3}
          placeholder="任意（例: スーパーまとめ買い）"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        {errors.memo && <p className="text-xs text-rose-600">{errors.memo}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={isSettlementTarget}
          onChange={(event) => setIsSettlementTarget(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-teal-600"
        />
        精算対象に含める
      </label>

      {formError && <p className="text-sm text-rose-600">{formError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60"
        >
          {submitting ? "保存中..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-600"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}
