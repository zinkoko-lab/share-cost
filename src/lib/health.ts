import { toErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";

export type HealthCheckResult = {
  ok: boolean;
  supabaseConfigured: boolean;
  authSessionAvailable: boolean;
  expensesTableAccessible: boolean;
  settlementsTableAccessible: boolean;
  message: string;
};

export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  if (!supabase) {
    return {
      ok: false,
      supabaseConfigured: false,
      authSessionAvailable: false,
      expensesTableAccessible: false,
      settlementsTableAccessible: false,
      message: "Supabaseの環境変数が未設定です。",
    };
  }

  const [{ error: expensesError }, { error: settlementsError }, { data: authData }] =
    await Promise.all([
      supabase.from("expenses").select("id", { count: "exact", head: true }),
      supabase.from("monthly_settlements").select("id", { count: "exact", head: true }),
      supabase.auth.getSession(),
    ]);

  const expensesOk = !expensesError;
  const settlementsOk = !settlementsError;

  if (expensesOk && settlementsOk) {
    return {
      ok: true,
      supabaseConfigured: true,
      authSessionAvailable: Boolean(authData.session),
      expensesTableAccessible: true,
      settlementsTableAccessible: true,
      message: "DB接続は正常です。",
    };
  }

  const merged = expensesError ?? settlementsError;
  return {
    ok: false,
    supabaseConfigured: true,
    authSessionAvailable: Boolean(authData.session),
    expensesTableAccessible: expensesOk,
    settlementsTableAccessible: settlementsOk,
    message: toErrorMessage(merged, "DB接続確認に失敗しました。"),
  };
}
