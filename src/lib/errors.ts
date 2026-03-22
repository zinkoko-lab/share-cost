function translateKnownError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("could not find the table")) {
    return "DBに必要なテーブルがありません。Supabaseで schema.sql を実行してください。";
  }
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "権限エラーです。SupabaseのRLSポリシー設定を確認してください。";
  }
  if (lower.includes("invalid input syntax for type date")) {
    return "日付の形式が不正です。";
  }
  if (lower.includes("invalid input syntax for type integer")) {
    return "金額の形式が不正です。";
  }
  if (lower.includes("duplicate key value")) {
    return "重複データのため保存できませんでした。";
  }

  return message;
}

export function toErrorMessage(error: unknown, fallback = "処理に失敗しました。"): string {
  if (error instanceof Error) return translateKnownError(error.message);

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return translateKnownError((error as { message: string }).message);
  }

  return fallback;
}
