import { toErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";

export type SignUpProfileInput = {
  displayName: string;
};

type UpsertProfileInput = {
  displayName: string;
  payerCode?: "ME" | "SISTER";
};

async function getAuthenticatedUserId(): Promise<string> {
  if (!supabase) throw new Error("Supabaseの環境変数が未設定です。");

  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(toErrorMessage(error, "ユーザー情報の取得に失敗しました。"));
  if (!data.user) throw new Error("ログインユーザーが見つかりません。");
  return data.user.id;
}

async function resolvePayerCode(userId: string): Promise<"ME" | "SISTER"> {
  if (!supabase) throw new Error("Supabaseの環境変数が未設定です。");

  const { data: myProfile, error: myProfileError } = await supabase
    .from("profiles")
    .select("payer_code")
    .eq("id", userId)
    .maybeSingle();

  if (myProfileError) {
    throw new Error(toErrorMessage(myProfileError, "プロフィール取得に失敗しました。"));
  }

  if (myProfile?.payer_code === "ME" || myProfile?.payer_code === "SISTER") {
    return myProfile.payer_code;
  }

  const { data: allProfiles, error: allProfilesError } = await supabase
    .from("profiles")
    .select("payer_code");

  if (allProfilesError) {
    throw new Error(toErrorMessage(allProfilesError, "プロフィール一覧取得に失敗しました。"));
  }

  const used = new Set(
    (allProfiles ?? [])
      .map((row) => row.payer_code)
      .filter((code): code is "ME" | "SISTER" => code === "ME" || code === "SISTER"),
  );

  if (!used.has("ME")) return "ME";
  if (!used.has("SISTER")) return "SISTER";

  throw new Error("支払者区分の割り当て上限に達しています。管理者に連絡してください。");
}

export async function requireAuthSession(): Promise<void> {
  if (!supabase) throw new Error("Supabaseの環境変数が未設定です。");

  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(toErrorMessage(error, "認証状態の確認に失敗しました。"));
  if (!data.session) throw new Error("ログインが必要です。");
}

export async function signIn(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error("Supabaseの環境変数が未設定です。");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(toErrorMessage(error, "ログインに失敗しました。"));
  void syncProfileFromSession();
}

export async function signUp(
  email: string,
  password: string,
  profile: SignUpProfileInput,
): Promise<{ emailConfirmationRequired: boolean }> {
  if (!supabase) throw new Error("Supabaseの環境変数が未設定です。");
  if (!profile.displayName.trim()) throw new Error("支払者名を入力してください。");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: profile.displayName.trim(),
      },
    },
  });
  if (error) throw new Error(toErrorMessage(error, "新規登録に失敗しました。"));

  if (data.session) {
    await upsertMyProfile({
      displayName: profile.displayName.trim(),
    });
  }

  return { emailConfirmationRequired: !data.session };
}

export async function signOut(): Promise<void> {
  if (!supabase) throw new Error("Supabaseの環境変数が未設定です。");

  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(toErrorMessage(error, "ログアウトに失敗しました。"));
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!supabase) throw new Error("Supabaseの環境変数が未設定です。");
  if (!email.trim()) throw new Error("メールアドレスを入力してください。");

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/reset-password`
      : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(toErrorMessage(error, "再設定メールの送信に失敗しました。"));
}

export async function upsertMyProfile(profile: UpsertProfileInput): Promise<void> {
  if (!supabase) throw new Error("Supabaseの環境変数が未設定です。");
  await requireAuthSession();

  const userId = await getAuthenticatedUserId();
  const payerCode = profile.payerCode ?? (await resolvePayerCode(userId));

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: profile.displayName.trim(),
      payer_code: payerCode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) throw new Error(toErrorMessage(error, "プロフィール保存に失敗しました。"));
}

export async function syncProfileFromSession(): Promise<void> {
  if (!supabase) return;

  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) return;

  const displayNameRaw = userResult.user.user_metadata?.display_name;
  const displayName = typeof displayNameRaw === "string" ? displayNameRaw.trim() : "";

  if (!displayName) return;

  await upsertMyProfile({
    displayName,
  });
}
