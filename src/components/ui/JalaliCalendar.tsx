"use client";

import { useState } from "react";
import { ChevronBack } from "./icons";
import { toFaDigits } from "@/lib/digits";
import { isoOfJalali, jalaliOf, monthLength, MONTHS, todayIso, WEEKDAY_SHORT, weekdayOf } from "@/lib/jalali";

/**
 * One Jalali month, weeks starting Saturday (right to left). Days outside [min, max] are
 * disabled. Today has a ring; the chosen day is filled.
 */
export function JalaliCalendar({
  value,
  onChange,
  min,
  max,
}: {
  value: string | null;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
}) {
  const start = jalaliOf(value ?? todayIso());
  const [view, setView] = useState({ jy: start.jy, jm: start.jm });
  const today = todayIso();

  const first = isoOfJalali({ jy: view.jy, jm: view.jm, jd: 1 });
  const offset = weekdayOf(first);
  const days = monthLength(view.jy, view.jm);
  const cells: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, i) => isoOfJalali({ jy: view.jy, jm: view.jm, jd: i + 1 })),
  ];

  const shift = (delta: number) =>
    setView((v) => {
      const m = v.jm + delta;
      return m < 1 ? { jy: v.jy - 1, jm: 12 } : m > 12 ? { jy: v.jy + 1, jm: 1 } : { jy: v.jy, jm: m };
    });
  const lastOfView = isoOfJalali({ jy: view.jy, jm: view.jm, jd: days });
  const canPrev = !min || first > min;
  const canNext = !max || lastOfView < max;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="ماه قبل"
          disabled={!canPrev}
          onClick={() => shift(-1)}
          className="grid size-11 place-items-center rounded-full text-text-primary disabled:opacity-30"
        >
          <ChevronBack size={20} className="rotate-180" />
        </button>
        <span className="text-body-strong text-text-primary">
          {MONTHS[view.jm - 1]} {toFaDigits(view.jy)}
        </span>
        <button
          type="button"
          aria-label="ماه بعد"
          disabled={!canNext}
          onClick={() => shift(1)}
          className="grid size-11 place-items-center rounded-full text-text-primary disabled:opacity-30"
        >
          <ChevronBack size={20} />
        </button>
      </div>

      <div
        className="grid grid-cols-7 gap-y-1 text-center"
        role="grid"
        aria-label={`${MONTHS[view.jm - 1]} ${toFaDigits(view.jy)}`}
      >
        {WEEKDAY_SHORT.map((d) => (
          <span key={d} className="pb-1 text-caption text-text-tertiary" role="columnheader">
            {d}
          </span>
        ))}
        {cells.map((iso, i) =>
          iso ? (
            <button
              key={iso}
              type="button"
              disabled={(min !== undefined && iso < min) || (max !== undefined && iso > max)}
              onClick={() => onChange(iso)}
              aria-pressed={value === iso}
              aria-current={iso === today ? "date" : undefined}
              className={`mx-auto grid size-10 place-items-center rounded-full text-[15px] transition-colors duration-150 disabled:opacity-25 ${
                value === iso
                  ? "bg-brand font-semibold text-text-on-brand"
                  : iso === today
                    ? "border border-border-focus text-text-brand"
                    : "text-text-primary active:bg-surface-brand-subtle"
              }`}
            >
              {toFaDigits(jalaliOf(iso).jd)}
            </button>
          ) : (
            <span key={`pad-${i}`} />
          ),
        )}
      </div>
    </div>
  );
}
