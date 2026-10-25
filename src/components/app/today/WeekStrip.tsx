"use client";

import { Card } from "@/components/ui/Card";
import { PenInjector } from "@/components/ui/icons";
import { MoodFace } from "@/components/ui/MoodFace";
import { useAppData } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { formatJalali, jalaliOf, WEEKDAY_SHORT } from "@/lib/jalali";
import { weekOf } from "@/lib/stats";
import { MOOD_LABEL } from "@/lib/symptoms";

/**
 * This week, Saturday to Friday: today is filled, the day the next injection is due has a
 * dashed ring, and each day shows what was logged (a pen for an injection, the day's face
 * for a check-in). Tapping a day opens what was logged on it.
 */
export function WeekStrip({
  today,
  due,
  onPick,
}: {
  today: string;
  due: string | null;
  onPick: (iso: string) => void;
}) {
  const { injections, checkIns } = useAppData();

  return (
    <Card className="px-1.5 py-2.5">
      <div className="grid grid-cols-7">
        {weekOf(today).map((iso, i) => {
          const isToday = iso === today;
          const future = iso > today;
          const injected = injections.some((x) => x.date === iso);
          const checkIn = checkIns.find((c) => c.date === iso);
          const isDue = !injected && iso === due;
          const label = [
            formatJalali(iso),
            isToday ? "امروز" : null,
            injected ? "تزریق ثبت شده" : isDue ? "روز تزریق" : null,
            checkIn ? `حال: ${MOOD_LABEL[checkIn.mood]}` : null,
          ]
            .filter(Boolean)
            .join("، ");
          return (
            <button
              key={iso}
              type="button"
              aria-label={label}
              aria-current={isToday ? "date" : undefined}
              onClick={() => onPick(iso)}
              className="flex flex-col items-center gap-1.5 rounded-[16px] py-1.5 transition-colors active:bg-surface-brand-subtle"
            >
              <span className={`text-caption-small ${isToday ? "text-text-brand" : "text-text-tertiary"}`}>
                {WEEKDAY_SHORT[i]}
              </span>
              <span
                className={`grid size-9 place-items-center rounded-full font-display text-[15px] font-bold ${
                  isToday
                    ? "bg-brand text-text-on-brand shadow-[0_6px_14px_-6px_rgb(110_75_245/0.7)]"
                    : future
                      ? "text-text-tertiary"
                      : "text-text-primary"
                } ${isDue && !isToday ? "border-[1.5px] border-dashed border-violet-400 text-text-brand" : ""}`}
              >
                {toFaDigits(jalaliOf(iso).jd)}
              </span>
              <span className="flex h-3.5 items-center gap-0.5 text-text-brand" aria-hidden="true">
                {injected ? <PenInjector size={13} strokeWidth={2.2} /> : null}
                {checkIn ? <MoodFace mood={checkIn.mood} size={13} className="text-violet-400" /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
