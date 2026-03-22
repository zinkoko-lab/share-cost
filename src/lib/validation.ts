import { z } from "zod";

import { CATEGORY_OPTIONS } from "@/lib/constants";

export const expenseSchema = z.object({
  expense_date: z.string().min(1, "日付を入力してください"),
  amount: z.coerce
    .number()
    .int("金額は整数で入力してください")
    .positive("金額は1円以上で入力してください"),
  category: z.enum(CATEGORY_OPTIONS, {
    error: "カテゴリを選択してください",
  }),
  payer: z.enum(["ME", "SISTER"], {
    error: "支払者を選択してください",
  }),
  memo: z.string().max(120, "メモは120文字以内で入力してください").optional(),
  is_settlement_target: z.boolean(),
});
