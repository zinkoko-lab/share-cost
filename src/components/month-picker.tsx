"use client";

type MonthPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
      対象月
      <input
        type="month"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none"
      />
    </label>
  );
}
