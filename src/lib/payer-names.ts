import { requireAuthSession, upsertMyProfile } from "@/lib/auth";
import { toErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";

export type PayerNameMap = {
  ME: string;
  SISTER: string;
};

export type MyPayerProfile = {
  payerCode: "ME" | "SISTER";
  displayName: string;
};

export const defaultPayerNameMap: PayerNameMap = {
  ME: "未設定",
  SISTER: "未設定",
};

export async function fetchPayerNameMap(): Promise<PayerNameMap> {
  await requireAuthSession();

  if (!supabase) {
    throw new Error("Supabaseの環境変数が未設定です。");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, payer_code, updated_at")
    .order("updated_at", { ascending: true });

  if (error) {
    throw new Error(toErrorMessage(error, "支払者名の取得に失敗しました。"));
  }

  const map: PayerNameMap = { ...defaultPayerNameMap };

  for (const row of data ?? []) {
    const payerCode = row.payer_code as "ME" | "SISTER" | null;
    if (payerCode === "ME" || payerCode === "SISTER") {
      const label = String(row.display_name ?? "").trim();
      if (label) map[payerCode] = label;
    }
  }

  return map;
}

export function toPayerOptions(nameMap: PayerNameMap): ReadonlyArray<{
  value: "ME" | "SISTER";
  label: string;
}> {
  return [
    { value: "ME", label: nameMap.ME },
    { value: "SISTER", label: nameMap.SISTER },
  ];
}

export async function fetchMyPayerProfile(): Promise<MyPayerProfile> {
  await requireAuthSession();

  if (!supabase) {
    throw new Error("Supabaseの環境変数が未設定です。");
  }

  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(toErrorMessage(userError, "ユーザー情報の取得に失敗しました。"));
  }
  if (!userResult.user) {
    throw new Error("ログインユーザーが見つかりません。");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, payer_code")
    .eq("id", userResult.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(toErrorMessage(error, "自分の支払者情報の取得に失敗しました。"));
  }

  const payerCode = data?.payer_code;
  const displayName = String(data?.display_name ?? "").trim();
  const validProfile =
    (payerCode === "ME" || payerCode === "SISTER") && Boolean(displayName);

  if (validProfile) {
    return {
      payerCode,
      displayName,
    };
  }

  // 旧ユーザー向け自動修復: display_name / payer_code が欠けている場合に補完する
  const metadataDisplayName =
    typeof userResult.user.user_metadata?.display_name === "string"
      ? userResult.user.user_metadata.display_name.trim()
      : "";
  const repairedDisplayName = displayName || metadataDisplayName;

  if (!repairedDisplayName) {
    throw new Error("プロフィールの支払者名が未設定です。新規登録時の表示名を設定してください。");
  }

  await upsertMyProfile({ displayName: repairedDisplayName });

  const { data: repaired, error: repairedError } = await supabase
    .from("profiles")
    .select("display_name, payer_code")
    .eq("id", userResult.user.id)
    .maybeSingle();

  if (repairedError) {
    throw new Error(toErrorMessage(repairedError, "プロフィール補完後の取得に失敗しました。"));
  }

  const repairedCode = repaired?.payer_code;
  const repairedName = String(repaired?.display_name ?? "").trim();
  if ((repairedCode !== "ME" && repairedCode !== "SISTER") || !repairedName) {
    throw new Error("プロフィールの支払者情報が未設定です。再ログインしてください。");
  }

  return {
    payerCode: repairedCode,
    displayName: repairedName,
  };
}
