"use client";

import Image from "next/image";
import { SeverityBars } from "@/components/app/SeverityBars";
import { Card } from "@/components/ui/Card";
import { Sparkles } from "@/components/ui/icons";
import { useAppData } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { addDays } from "@/lib/jalali";
import { severityByCycleDay, symptomCounts } from "@/lib/stats";
import journalIcon from "../../../../public/app/journal.png";

/** «روز تزریق» / «۲ روز بعد» */
function cycleDayLabel(d: number) {
  return d === 0 ? "روز تزریق" : `${toFaDigits(d)} روز بعد از تزریق`;
}

/**
 * Symptoms through the weekly cycle: the average strength of the day's worst symptom by
 * days since the injection, with the peak called out in words. Needs a few weeks of logs;
 * until then it says what it will show.
 */
export function CycleInsight() {
  const data = useAppData();
  const averages = severityByCycleDay(data, 7);
  const known = averages.filter((a): a is number => a !== null);

  if (data.injections.length < 2 || data.checkIns.length < 6 || !known.length) {
    return (
      <Card className="flex items-center gap-4 p-5">
        <Image src={journalIcon} alt="" width={56} height={56} className="size-14 shrink-0 object-contain" />
        <div>
          <h3 className="text-body-strong text-text-primary">بعد از هر تزریق</h3>
          <p className="text-caption text-pretty text-text-secondary">
            چند هفته که حالت رو ثبت کنی، اینجا می‌بینی علائمت چند روز بعد از تزریق بیشتره و کی آروم می‌شه.
          </p>
        </div>
      </Card>
    );
  }

  const max = Math.max(...known);
  const peak = averages.indexOf(max);
  const calm = averages.findIndex((a, d) => d > peak && a !== null && a <= max / 2);

  return (
    <Card className="p-5">
      <h3 className="mb-3 text-title-section text-text-primary">بعد از هر تزریق</h3>
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-brand-subtle text-text-brand">
          <Sparkles size={18} />
        </span>
        <p className="text-body-small text-pretty text-text-primary">
          {max === 0 ? (
            "توی روزهایی که ثبت کردی، علامتی نداشتی."
          ) : (
            <>
              علائمت معمولاً <strong className="font-semibold text-text-brand">{cycleDayLabel(peak)}</strong> بیشتره
              {calm > 0 ? `، و از روز ${toFaDigits(calm)} آروم‌تر می‌شه.` : "."}
            </>
          )}
        </p>
      </div>

      <div className="mt-5" aria-hidden="true">
        <div dir="ltr" className="flex h-24 items-end gap-2">
          {averages.map((a, d) => (
            <div key={d} className="flex flex-1 flex-col items-center justify-end">
              <div
                className={`w-full rounded-[8px] ${a === null ? "bg-violet-50" : d === peak && max > 0 ? "bg-brand-gradient" : "bg-violet-200"}`}
                style={{ height: a === null ? 6 : 6 + (a / 3) * 82 }}
              />
            </div>
          ))}
        </div>
        <div dir="ltr" className="mt-2 flex gap-2 text-center text-caption-small text-text-tertiary">
          {averages.map((_, d) => (
            <span key={d} className={`flex-1 ${d === peak && max > 0 ? "font-semibold text-text-brand" : ""}`}>
              {d === 0 ? "تزریق" : toFaDigits(d)}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-3 border-t border-violet-100 pt-3 text-caption text-text-secondary">
        شدت علائم بر اساس فاصله از تزریق، از {toFaDigits(data.checkIns.length)} روزی که ثبت کردی.
      </p>
    </Card>
  );
}

/**
 * Which symptoms came up in the period, on how many of the logged days (the bar), and how
 * strong at worst (the three small bars). A card title says what it is.
 */
export function SymptomFrequency({ today, days }: { today: string; days: number }) {
  const { checkIns } = useAppData();
  const from = addDays(today, -(days - 1));
  const counts = symptomCounts(checkIns, from, today);
  const logged = checkIns.filter((c) => c.date >= from && c.date <= today).length;

  return (
    <Card className="p-5">
      <h3 className="text-title-section text-text-primary">علائم پرتکرار</h3>
      <p className="mb-4 text-caption text-text-secondary">چند روز از روزهایی که ثبت کردی، و شدیدترین حالتش</p>
      {counts.length ? (
        <ul className="flex flex-col gap-3.5">
          {counts.map((s) => (
            <li key={s.id} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-label text-text-primary">{s.label}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-violet-50" dir="ltr" aria-hidden="true">
                <span
                  className="block h-full rounded-full bg-brand-gradient"
                  style={{ width: `${Math.max(6, (s.days / Math.max(logged, 1)) * 100)}%` }}
                />
              </span>
              <span className="w-12 shrink-0 text-end text-caption text-text-secondary">{toFaDigits(s.days)} روز</span>
              <SeverityBars level={s.worst} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-[16px] bg-surface-brand-subtle px-4 py-4 text-center text-caption text-text-secondary">
          {logged ? "توی این مدت علامتی ثبت نکردی." : "توی این مدت حالی ثبت نشده."}
        </p>
      )}
    </Card>
  );
}
