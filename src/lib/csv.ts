import type { Expense } from "@/lib/types";
import type { PayerNameMap } from "@/lib/payer-names";
import { payerLabel } from "@/lib/format";

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildExpensesCsv(
  expenses: Expense[],
  payerNameMap?: Partial<PayerNameMap>,
): string {
  const header = ["日付", "金額", "カテゴリ", "支払者", "メモ", "精算対象"];

  const rows = expenses.map((expense) => [
    expense.expense_date,
    String(expense.amount),
    expense.category,
    payerLabel(expense.payer, payerNameMap),
    expense.memo ?? "",
    expense.is_settlement_target ? "対象" : "対象外",
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
