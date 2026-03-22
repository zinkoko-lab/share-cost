import { CATEGORY_OPTIONS } from "@/lib/constants";

export type Category = (typeof CATEGORY_OPTIONS)[number];
export type Payer = "ME" | "SISTER";

export type Expense = {
  id: string;
  expense_date: string;
  amount: number;
  category: Category;
  payer: Payer;
  memo: string | null;
  is_settlement_target: boolean;
  created_at: string;
  updated_at: string;
};

export type ExpenseInput = {
  expense_date: string;
  amount: number;
  category: Category;
  payer: Payer;
  memo?: string;
  is_settlement_target: boolean;
};

export type SettlementSummary = {
  totalTarget: number;
  paidMe: number;
  paidSister: number;
  perPerson: number;
  transferAmount: number;
  from: "ME" | "SISTER" | "NONE";
  to: "ME" | "SISTER" | "NONE";
};

export type MonthlySettlement = {
  id: string;
  target_month: string;
  is_confirmed: boolean;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};
