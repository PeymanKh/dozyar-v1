"use client";

import { useState } from "react";
import { DateSheet, TimeSheet } from "@/components/ui/PickerSheets";
import { Calendar, Clock } from "@/components/ui/icons";
import { addDays, formatJalali } from "@/lib/jalali";
import { formatTime } from "@/lib/plan";

const pill =
  "flex h-11 items-center gap-2 rounded-full border border-violet-200 bg-surface px-4 text-label text-text-primary transition-colors active:bg-surface-brand-subtle";

/** «امروز» / «دیروز» / «۳۰ مهر» */
export function dayLabel(iso: string, today: string): string {
  if (iso === today) return "امروز";
  if (iso === addDays(today, -1)) return "دیروز";
  return formatJalali(iso, false);
}

/** The day something happened; opens a Jalali calendar (no future days). */
export function DatePill({
  value,
  onChange,
  today,
}: {
  value: string;
  onChange: (iso: string) => void;
  today: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={() => setOpen(true)} className={pill}>
        <Calendar size={18} className="text-text-brand" />
        {dayLabel(value, today)}
      </button>
      <DateSheet
        open={open}
        onClose={() => setOpen(false)}
        title="کدوم روز؟"
        value={value}
        onChange={onChange}
        max={today}
      />
    </>
  );
}

/** The time of day; opens hour and minute wheels. */
export function TimePill({ value, onChange }: { value: string; onChange: (time: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={() => setOpen(true)} className={pill}>
        <Clock size={18} className="text-text-brand" />
        ساعت {formatTime(value)}
      </button>
      <TimeSheet open={open} onClose={() => setOpen(false)} value={value} onChange={onChange} />
    </>
  );
}
