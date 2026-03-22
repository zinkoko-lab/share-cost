import { addMonths, format, parse } from "date-fns";

export function getCurrentMonth(): string {
  return format(new Date(), "yyyy-MM");
}

export function getMonthDateRange(month: string): { start: string; end: string } {
  const monthDate = parse(`${month}-01`, "yyyy-MM-dd", new Date());
  const nextMonth = addMonths(monthDate, 1);

  return {
    start: format(monthDate, "yyyy-MM-dd"),
    end: format(nextMonth, "yyyy-MM-dd"),
  };
}

export function toInputDate(dateString: string): string {
  return dateString.slice(0, 10);
}

export function toMonthStringFromDate(dateString: string): string {
  return dateString.slice(0, 7);
}
