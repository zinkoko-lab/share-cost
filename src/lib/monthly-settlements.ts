import { requireAuthSession } from "@/lib/auth";
import { toErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import type { MonthlySettlement } from "@/lib/types";

const TABLE = "monthly_settlements";

function assertSupabase() {
  if (!supabase) {
    throw new Error("Supabaseの環境変数が未設定です。");
  }

  return supabase;
}

export async function fetchMonthlySettlement(month: string): Promise<MonthlySettlement | null> {
  await requireAuthSession();
  const client = assertSupabase();

  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("target_month", month)
    .maybeSingle();

  if (error) throw new Error(toErrorMessage(error, "月次精算状態の取得に失敗しました。"));
  return (data as MonthlySettlement | null) ?? null;
}

export async function setMonthlyConfirmed(month: string, confirmed: boolean): Promise<void> {
  await requireAuthSession();
  const client = assertSupabase();

  const { error } = await client.from(TABLE).upsert(
    {
      target_month: month,
      is_confirmed: confirmed,
      confirmed_at: confirmed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "target_month" },
  );

  if (error) throw new Error(toErrorMessage(error, "月次精算状態の更新に失敗しました。"));
}

export async function assertMonthEditable(month: string): Promise<void> {
  const record = await fetchMonthlySettlement(month);

  if (record?.is_confirmed) {
    throw new Error(`${month} は精算確定済みのため編集できません。`);
  }
}
