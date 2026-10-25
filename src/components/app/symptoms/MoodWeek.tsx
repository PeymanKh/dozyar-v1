"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { PenInjector, Plus } from "@/components/ui/icons";
import { MoodFace } from "@/components/ui/MoodFace";
import { useAppData } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { daysBetween, formatJalali, jalaliOf, WEEKDAY_SHORT } from "@/lib/jalali";
import { weekOf } from "@/lib/stats";
import { MOOD_LABEL } from "@/lib/symptoms";

/**
 * This week by face, Saturday to Friday. A logged day shows its face and opens what was
 * logged; a day not logged yet shows «+» and opens the check-in for that day, so filling in
 * a missed day is one tap. Injection days carry a pen.
 */
export function MoodWeek({ today, onOpen }: { today: string; onOpen: (iso: string) => void }) {
  const router = useRouter();
  const { checkIns, injections } = useAppData();
  const week = weekOf(today);
  const byDate = new Map(checkIns.map((c) => [c.date, c]));
  const elapsed = daysBetween(week[0], today) + 1;
  const logged = week.filter((d) => d <= today && byDate.has(d)).length;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="text-title-section text-text-primary">این هفته</h2>
        <span className="text-caption text-text-secondary">
          {toFaDigits(logged)} از {toFaDigits(elapsed)} روز ثبت شده
        </span>
      </div>

      <div className="grid grid-cols-7">
        {week.map((iso, i) => {
          const c = byDate.get(iso);
          const future = iso > today;
          const isToday = iso === today;
          const shot = injections.some((x) => x.date === iso);
          const label = [
            formatJalali(iso),
            c ? `حال: ${MOOD_LABEL[c.mood]}` : future ? null : "ثبت نشده، بزن تا ثبت کنی",
            shot ? "روز تزریق" : null,
          ]
            .filter(Boolean)
            .join("، ");
          return (
            <motion.button
              key={iso}
              type="button"
              aria-label={label}
              aria-current={isToday ? "date" : undefined}
              disabled={future}
              onClick={() => (c ? onOpen(iso) : router.push(`/check-in?date=${iso}`))}
              whileTap={future ? undefined : { scale: 0.92 }}
              transition={{ type: "spring", bounce: 0, duration: 0.25 }}
              className="flex flex-col items-center gap-1.5 py-1"
            >
              <span className={`text-caption-small ${isToday ? "font-bold text-text-brand" : "text-text-tertiary"}`}>
                {WEEKDAY_SHORT[i]}
              </span>
              <span
                className={`grid size-10 place-items-center rounded-full transition-colors ${
                  c
                    ? "bg-surface-brand-soft text-violet-600"
                    : future
                      ? "bg-violet-50"
                      : "border-[1.5px] border-dashed border-violet-300 text-violet-400"
                } ${isToday ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : ""}`}
              >
                {c ? <MoodFace mood={c.mood} size={24} /> : future ? null : <Plus size={16} strokeWidth={2.4} />}
              </span>
              <span
                className="flex h-3.5 items-center gap-0.5 text-caption-small text-text-secondary"
                aria-hidden="true"
              >
                <span className={future ? "text-text-tertiary" : undefined}>{toFaDigits(jalaliOf(iso).jd)}</span>
                {shot ? <PenInjector size={11} strokeWidth={2.4} className="text-text-brand" /> : null}
              </span>
            </motion.button>
          );
        })}
      </div>
    </Card>
  );
}
