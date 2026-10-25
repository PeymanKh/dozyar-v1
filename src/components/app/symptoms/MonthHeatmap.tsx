"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ChevronBack, PenInjector } from "@/components/ui/icons";
import { useAppData } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { addDays, formatJalali, jalaliOf, MONTHS, WEEKDAY_SHORT, weekdayOf } from "@/lib/jalali";
import { worstSeverity } from "@/lib/stats";
import { SEVERITY_LABEL, type Severity } from "@/lib/symptoms";

// Logged days are tinted by the worst symptom of the day; deeper violet = stronger.
const TINT: Record<Severity, string> = {
  0: "bg-violet-50 text-text-primary",
  1: "bg-violet-200 text-text-primary",
  2: "bg-violet-400 text-white",
  3: "bg-violet-600 text-white",
};

const WEEKS = 5;

/**
 * The last five weeks of check-ins, Saturday first, so recent days are always in view (a
 * calendar month is nearly empty in its first days). Each logged day is tinted by how strong
 * its symptoms were and injection days carry a pen, so symptoms read alongside the treatment.
 * The first day of a month shows the month's name. Tapping a day opens it.
 */
export function MonthHeatmap({ today, onPick }: { today: string; onPick: (iso: string) => void }) {
  const { checkIns, injections } = useAppData();
  const [page, setPage] = useState(0);

  const end = addDays(today, 6 - weekdayOf(today) - page * WEEKS * 7);
  const start = addDays(end, -(WEEKS * 7 - 1));
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => addDays(start, i));
  const byDate = new Map(checkIns.map((c) => [c.date, c]));
  const shots = new Set(injections.map((i) => i.date));
  const earliest = [checkIns[0]?.date, injections[0]?.date, today].filter(Boolean).sort()[0]!;
  const canPrev = start > earliest;
  const canNext = page > 0;
  const range = `${formatJalali(start, false)} تا ${formatJalali(end < today ? end : today, false)}`;

  return (
    <Card className="p-4">
      <h3 className="px-1 text-title-section text-text-primary">تقویم علائم</h3>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="هفته‌های قبل"
          disabled={!canPrev}
          onClick={() => setPage((p) => p + 1)}
          className="grid size-11 place-items-center rounded-full text-text-primary active:bg-surface-brand-subtle disabled:opacity-25"
        >
          <ChevronBack size={20} className="rotate-180" />
        </button>
        <span className="text-body-strong text-text-primary" aria-live="polite">
          {range}
        </span>
        <button
          type="button"
          aria-label="هفته‌های بعد"
          disabled={!canNext}
          onClick={() => setPage((p) => p - 1)}
          className="grid size-11 place-items-center rounded-full text-text-primary active:bg-surface-brand-subtle disabled:opacity-25"
        >
          <ChevronBack size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label={range}>
        {WEEKDAY_SHORT.map((d) => (
          <span key={d} role="columnheader" className="pb-1 text-center text-caption-small text-text-tertiary">
            {d}
          </span>
        ))}
        {cells.map((iso) => {
          const c = byDate.get(iso);
          const j = jalaliOf(iso);
          const severity = c ? worstSeverity(c) : null;
          const future = iso > today;
          const shot = shots.has(iso);
          const label = [
            formatJalali(iso),
            c ? (severity ? `علائم ${SEVERITY_LABEL[severity]}` : "بدون علامت") : future ? null : "ثبت نشده",
            shot ? "روز تزریق" : null,
          ]
            .filter(Boolean)
            .join("، ");
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              aria-label={label}
              disabled={future}
              onClick={() => onPick(iso)}
              className={`relative grid aspect-square place-items-center rounded-[12px] text-[13px] font-semibold transition-transform active:scale-95 disabled:active:scale-100 ${
                severity !== null ? TINT[severity] : future ? "text-text-tertiary/60" : "text-text-secondary"
              } ${iso === today ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : ""}`}
            >
              {j.jd === 1 ? (
                <span className="text-[10px] leading-none font-bold">{MONTHS[j.jm - 1]}</span>
              ) : (
                toFaDigits(j.jd)
              )}
              {shot ? (
                <PenInjector
                  size={10}
                  strokeWidth={2.6}
                  aria-hidden="true"
                  className={`absolute bottom-0.5 ${severity !== null && severity >= 2 ? "text-white" : "text-text-brand"}`}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-violet-100 pt-3 text-caption-small text-text-secondary">
        {([0, 1, 2, 3] as Severity[]).map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-3 rounded-[4px] ${TINT[s].split(" ")[0]}`} />
            {s === 0 ? "بدون علامت" : SEVERITY_LABEL[s]}
          </li>
        ))}
        <li className="flex items-center gap-1">
          <PenInjector size={12} strokeWidth={2.4} className="text-text-brand" aria-hidden="true" />
          تزریق
        </li>
      </ul>
    </Card>
  );
}
