import type { PayerNameMap } from "@/lib/payer-names";

const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export function formatYen(value: number): string {
  return yenFormatter.format(value);
}

export function payerLabel(
  payer: "ME" | "SISTER" | "NONE",
  nameMap?: Partial<PayerNameMap>,
): string {
  if (payer === "NONE") return "該当なし";
  if (payer === "ME") return nameMap?.ME ?? "未設定";
  return nameMap?.SISTER ?? "未設定";
}
