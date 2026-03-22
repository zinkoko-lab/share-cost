import { getMonthDateRange } from "@/lib/date";
import { requireAuthSession } from "@/lib/auth";
import { toErrorMessage } from "@/lib/errors";
import { assertMonthEditable } from "@/lib/monthly-settlements";
import { supabase } from "@/lib/supabase";
import type { Expense, ExpenseInput } from "@/lib/types";

const TABLE = "expenses";

function assertSupabase() {
  if (!supabase) {
    throw new Error("Supabaseの環境変数が未設定です。");
  }

  return supabase;
}

export async function fetchExpensesByMonth(month: string): Promise<Expense[]> {
  await requireAuthSession();
  const client = assertSupabase();
  const { start, end } = getMonthDateRange(month);

  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .gte("expense_date", start)
    .lt("expense_date", end)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(toErrorMessage(error, "支出の取得に失敗しました。"));
  return (data as Expense[]) ?? [];
}

export async function createExpense(input: ExpenseInput): Promise<void> {
  await requireAuthSession();
  const client = assertSupabase();
  await assertMonthEditable(input.expense_date.slice(0, 7));

  const { error } = await client.from(TABLE).insert({
    expense_date: input.expense_date,
    amount: input.amount,
    category: input.category,
    payer: input.payer,
    memo: input.memo?.trim() ? input.memo.trim() : null,
    is_settlement_target: input.is_settlement_target,
  });

  if (error) throw new Error(toErrorMessage(error, "支出の保存に失敗しました。"));
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<void> {
  await requireAuthSession();
  const client = assertSupabase();
  await assertMonthEditable(input.expense_date.slice(0, 7));

  const { error } = await client
    .from(TABLE)
    .update({
      expense_date: input.expense_date,
      amount: input.amount,
      category: input.category,
      payer: input.payer,
      memo: input.memo?.trim() ? input.memo.trim() : null,
      is_settlement_target: input.is_settlement_target,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(toErrorMessage(error, "支出の更新に失敗しました。"));
}

export async function deleteExpense(id: string): Promise<void> {
  await requireAuthSession();
  const client = assertSupabase();
  const { data: current, error: fetchError } = await client
    .from(TABLE)
    .select("expense_date")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new Error(toErrorMessage(fetchError, "支出データ取得に失敗しました。"));
  if (current?.expense_date) {
    await assertMonthEditable(String(current.expense_date).slice(0, 7));
  }

  const { error } = await client.from(TABLE).delete().eq("id", id);

  if (error) throw new Error(toErrorMessage(error, "支出の削除に失敗しました。"));
}
