import type { Expense, SettlementSummary } from "@/lib/types";

export function calculateSettlement(expenses: Expense[]): SettlementSummary {
  const settlementTargets = expenses.filter((expense) => expense.is_settlement_target);

  const totalTarget = settlementTargets.reduce((sum, expense) => sum + expense.amount, 0);
  const paidMe = settlementTargets
    .filter((expense) => expense.payer === "ME")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const paidSister = settlementTargets
    .filter((expense) => expense.payer === "SISTER")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const perPerson = totalTarget / 2;
  const meDiff = paidMe - perPerson;

  if (Math.abs(meDiff) < 1) {
    return {
      totalTarget,
      paidMe,
      paidSister,
      perPerson,
      transferAmount: 0,
      from: "NONE",
      to: "NONE",
    };
  }

  if (meDiff > 0) {
    return {
      totalTarget,
      paidMe,
      paidSister,
      perPerson,
      transferAmount: Math.round(meDiff),
      from: "SISTER",
      to: "ME",
    };
  }

  return {
    totalTarget,
    paidMe,
    paidSister,
    perPerson,
    transferAmount: Math.round(Math.abs(meDiff)),
    from: "ME",
    to: "SISTER",
  };
}
