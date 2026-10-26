"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { WeightChart } from "./WeightChart";
import { GhostChart } from "@/components/app/GhostChart";
import { Sparkline } from "@/components/app/Sparkline";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChevronBack, Trash } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { removeWeight, restoreWeight, useAppData, type WeightLog } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { addDays, daysBetween, formatJalali, WEEKDAYS, weekdayOf } from "@/lib/jalali";
import { useOnboarding } from "@/lib/onboarding-store";
import { formatKg, rhythmOf } from "@/lib/plan";
import { symptomCounts, weekOf, weightChange, weightSummary } from "@/lib/stats";
import { doseState } from "@/lib/treatment";
import { openSheet, toast } from "@/lib/ui-store";
import goalIcon from "../../../../public/onboarding/goal.png";
import medalIcon from "../../../../public/app/medal.png";
import tapeIcon from "../../../../public/app/tape.png";

const pct = (n: number) => `${toFaDigits(String(Math.round(n * 10) / 10)).replace(".", "٫")}٪`;

/**
 * The whole journey in one card: how much is gone, as kilos and as a share of the starting
 * weight, and how far along the way to the goal (filling from the left, like every bar).
 * The medal appears at 5%, 10% and 15%.
 */
export function JourneyCard() {
  const reduce = useReducedMotion();
  const o = useOnboarding();
  const { weights } = useAppData();
  const s = weightSummary(o, weights);
  if (!s) return null;
  const milestone = [15, 10, 5].find((m) => s.lostPct >= m);

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-caption text-text-secondary">{s.lost > 0 ? "تا الان کم کردی" : "نقطه‌ی شروعت"}</p>
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-[34px] leading-tight font-bold text-text-primary">
              {formatKg(s.lost > 0 ? s.lost : s.current)}
            </span>
            <span className="text-label text-text-secondary">کیلو</span>
          </p>
          <p className="text-caption text-text-brand">
            {milestone ? `به ${pct(milestone)} رسیدی! ` : ""}
            {s.lost > 0 ? `${pct(s.lostPct)} از وزن شروع` : "از اینجا مسیرت رو می‌بینی"}
          </p>
        </div>
        <div className="relative grid size-20 shrink-0 place-items-center">
          <div aria-hidden="true" className="halo absolute -inset-3" />
          <Image
            src={milestone ? medalIcon : goalIcon}
            alt=""
            width={80}
            height={80}
            className="relative size-20 object-contain"
          />
        </div>
      </div>

      {s.goal !== null && s.toGoalProgress !== null ? (
        <div className="mt-5">
          <div
            dir="ltr"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(s.toGoalProgress * 100)}
            aria-label="مسیر تا هدف"
            className="relative h-2.5 rounded-full bg-violet-100"
          >
            <motion.div
              className="absolute inset-0 origin-left rounded-full bg-brand-gradient"
              initial={{ scaleX: reduce ? s.toGoalProgress : 0 }}
              animate={{ scaleX: s.toGoalProgress }}
              transition={{ type: "spring", bounce: 0, duration: 1, delay: 0.15 }}
            />
            <span
              aria-hidden="true"
              className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-brand shadow-[0_2px_8px_rgb(110_75_245/0.45)]"
              style={{ left: `${Math.max(4, s.toGoalProgress * 100)}%` }}
            />
          </div>
          <div dir="ltr" className="mt-2.5 flex justify-between text-caption text-text-secondary">
            <span dir="rtl">شروع {formatKg(s.start)}</span>
            <span dir="rtl">هدف {formatKg(s.goal)}</span>
          </div>
          <p className="mt-3 border-t border-violet-100 pt-3 text-caption text-text-secondary">
            {s.toGoal ? `${formatKg(s.toGoal)} کیلو تا هدف. هر قدم حساب می‌شه.` : "به هدفت رسیدی. آفرین!"}
          </p>
        </div>
      ) : (
        <p className="mt-4 border-t border-violet-100 pt-3 text-caption text-text-secondary">
          برای دیدن مسیرت تا هدف، وزن هدفت رو از پروفایل اضافه کن.
        </p>
      )}
    </Card>
  );
}

type Range = "1m" | "3m" | "all";
const RANGES: { value: Range; label: string }[] = [
  { value: "1m", label: "۱ ماه" },
  { value: "3m", label: "۳ ماه" },
  { value: "all", label: "همه" },
];

/** Weight over time with its range switch; reading a day on the chart shows it in the header. */
export function WeightCard({ today }: { today: string }) {
  const o = useOnboarding();
  const { weights, injections } = useAppData();
  const [range, setRange] = useState<Range>("3m");
  const [scrub, setScrub] = useState<WeightLog | null>(null);

  if (!weights.length) return null;
  const first = weights[0].date;
  const start = range === "all" ? first : addDays(today, range === "1m" ? -30 : -90);
  const from = start < first ? first : start;
  const inRange = weights.filter((w) => w.date >= from);
  const base = inRange[0];
  const current = weights.at(-1)!;
  const shown = scrub ?? current;
  const change = Math.round((shown.kg - base.kg) * 10) / 10;
  const goal = typeof o.goal === "number" ? o.goal : null;

  return (
    <Card className="p-5">
      <div className="flex items-end justify-between gap-3">
        <div aria-live="polite">
          <p className="text-caption text-text-secondary">{scrub ? formatJalali(scrub.date) : "وزن فعلی"}</p>
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-[30px] leading-tight font-bold text-text-primary">
              {formatKg(shown.kg)}
            </span>
            <span className="text-label text-text-secondary">کیلو</span>
          </p>
          <p className={`text-caption ${change < 0 ? "text-text-brand" : "text-text-secondary"}`}>
            {weights.length === 1
              ? `ثبت‌شده در ${formatJalali(current.date, false)}`
              : change === 0
                ? "بدون تغییر در این بازه"
                : `${formatKg(Math.abs(change))} کیلو ${change < 0 ? "کمتر" : "بیشتر"} از ${formatJalali(base.date, false)}`}
          </p>
        </div>
      </div>

      {weights.length > 1 ? (
        <>
          <div className="mt-4">
            <Segmented label="بازه‌ی نمودار" value={range} onChange={setRange} options={RANGES} />
          </div>
          <div className="mt-4">
            {inRange.length > 1 ? (
              <WeightChart
                weights={weights}
                injections={injections}
                goal={goal}
                from={from}
                to={today}
                onScrub={setScrub}
              />
            ) : (
              <GhostChart height={208}>
                <p className="text-body-strong text-text-primary">توی این بازه فقط یه وزن ثبت شده</p>
                <button
                  type="button"
                  onClick={() => setRange("all")}
                  className="-mt-1 h-10 rounded-full bg-surface px-4 text-label text-text-brand shadow-card active:bg-surface-brand-subtle"
                >
                  دیدن همه‌ی وزن‌ها
                </button>
              </GhostChart>
            )}
          </div>
          {inRange.length > 1 ? (
            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-caption-small text-text-secondary">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-2 w-[3px] rounded-full bg-violet-300" />
                تزریق
              </span>
              <span>برای دیدن هر روز، روی نمودار بکش</span>
            </p>
          ) : null}
        </>
      ) : (
        // Before the second weigh-in: what the chart will be, blurred, with what makes it appear.
        <div className="mt-4">
          <GhostChart height={196}>
            <p className="text-body-strong text-text-primary">نمودار وزنت اینجا ساخته می‌شه</p>
            <p className="-mt-2 text-caption text-balance text-text-secondary">
              هر چند روز یه بار خودت رو وزن کن؛ از وزن دوم، خط روندت پیدا می‌شه.
            </p>
          </GhostChart>
        </div>
      )}

      <Button variant="secondary" className="mt-4" onClick={() => openSheet("weight")}>
        ثبت وزن
      </Button>
    </Card>
  );
}

/** This week (Saturday to today) in four numbers. */
export function WeekSummary({ today, now }: { today: string; now: Date }) {
  const o = useOnboarding();
  const { weights, injections, checkIns } = useAppData();
  const week = weekOf(today);
  const from = week[0];
  const elapsed = daysBetween(from, today) + 1;
  const change = weightChange(weights, from, today);
  const shots = injections.filter((i) => i.date >= from && i.date <= today).length;
  const logged = checkIns.filter((c) => c.date >= from && c.date <= today).length;
  const top = symptomCounts(checkIns, from, today)[0];
  const state = doseState(o, injections, now);

  // Weekly: done, or the day it is due (not a "0 of 1" before it is even due).
  let shot: string;
  if (rhythmOf(o.medication) === "daily") shot = `${toFaDigits(shots)} از ${toFaDigits(elapsed)}`;
  else if (shots) shot = "انجام شد";
  else if ("due" in state && state.due > today && state.due <= week[6]) shot = WEEKDAYS[weekdayOf(state.due)];
  else if ("due" in state && state.due === today) shot = "امروز";
  else shot = "ثبت نشده";

  const cells = [
    {
      label: "وزن",
      value:
        change === null
          ? "—"
          : change === 0
            ? "بدون تغییر"
            : `${formatKg(Math.abs(change))} کیلو ${change < 0 ? "کمتر" : "بیشتر"}`,
    },
    { label: "تزریق", value: shot },
    { label: "ثبت حال", value: `${toFaDigits(logged)} از ${toFaDigits(elapsed)} روز` },
    { label: "علامت غالب", value: top ? top.label : "هیچی" },
  ];

  return (
    <Card className="p-5">
      <p className="text-caption text-text-secondary">
        {formatJalali(from, false)} تا {formatJalali(today, false)}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-2.5">
        {cells.map((c) => (
          <div key={c.label} className="rounded-[18px] bg-surface-brand-subtle px-4 py-3">
            <dt className="text-caption text-text-secondary">{c.label}</dt>
            <dd className="text-label text-text-primary">{c.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/** The waist measurement, its change since the first one, and its trend. */
export function WaistCard() {
  const { measurements } = useAppData();
  const last = measurements.at(-1);
  const diff = last ? Math.round((measurements[0].waistCm - last.waistCm) * 10) / 10 : 0;

  return (
    <Card className="flex items-center gap-4 p-4">
      <Image src={tapeIcon} alt="" width={56} height={56} className="size-14 shrink-0 object-contain" />
      <div className="min-w-0 flex-1">
        <p className="text-caption text-text-secondary">دور کمر</p>
        {last ? (
          <>
            <p className="flex items-baseline gap-1">
              <span className="font-display text-[22px] leading-tight font-bold text-text-primary">
                {formatKg(last.waistCm)}
              </span>
              <span className="text-caption text-text-secondary">سانت</span>
            </p>
            <p className={`text-caption ${diff > 0 ? "text-text-brand" : "text-text-tertiary"}`}>
              {diff > 0 ? `${formatKg(diff)} سانت کمتر از اولین اندازه` : `${formatJalali(last.date, false)}`}
            </p>
          </>
        ) : (
          <p className="text-caption text-pretty text-text-secondary">هر دو هفته یه بار، هم‌سطح ناف اندازه بگیر.</p>
        )}
      </div>
      {measurements.length > 1 ? (
        <div className="w-20 shrink-0">
          <Sparkline values={measurements.map((m) => m.waistCm)} width={80} height={32} />
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => openSheet("waist")}
        className="h-10 shrink-0 rounded-full bg-surface-brand-subtle px-4 text-label text-text-brand active:bg-violet-100"
      >
        ثبت
      </button>
    </Card>
  );
}

const HISTORY = 6;

/** Every weigh-in, newest first, with the change from the one before. Tapping one opens it. */
export function WeightHistory() {
  const { weights } = useAppData();
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<WeightLog | null>(null);
  if (!weights.length) return null;

  const rows = [...weights].reverse();
  const shown = all ? rows : rows.slice(0, HISTORY);

  return (
    <>
      <Card className="divide-y divide-violet-100 overflow-hidden">
        {shown.map((w) => {
          const i = weights.indexOf(w);
          const prev = i > 0 ? weights[i - 1].kg : null;
          const d = prev === null ? null : Math.round((w.kg - prev) * 10) / 10;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => setOpen(w)}
              className="flex min-h-14 w-full items-center gap-3 px-5 py-3 text-start transition-colors active:bg-surface-brand-subtle"
            >
              <span className="min-w-0 flex-1 text-body-strong text-text-primary">{formatJalali(w.date)}</span>
              {d !== null && d !== 0 ? (
                <span className={`text-caption ${d < 0 ? "text-text-brand" : "text-text-tertiary"}`} dir="ltr">
                  {d < 0 ? "−" : "+"}
                  {formatKg(Math.abs(d))}
                </span>
              ) : null}
              <span className="w-16 text-end text-label text-text-primary">{formatKg(w.kg)} کیلو</span>
              <ChevronBack size={18} className="shrink-0 text-text-tertiary" aria-hidden="true" />
            </button>
          );
        })}
      </Card>
      {rows.length > HISTORY ? (
        <Button variant="plain" className="mt-1" onClick={() => setAll((a) => !a)}>
          {all ? "نمایش کمتر" : `نمایش همه (${toFaDigits(rows.length)})`}
        </Button>
      ) : null}

      <Sheet open={open !== null} onClose={() => setOpen(null)} title={open ? formatJalali(open.date) : ""}>
        {open ? (
          <div className="flex flex-col items-center gap-2">
            <p className="flex items-baseline gap-1.5">
              <span className="font-display text-[40px] leading-none font-bold text-text-primary">
                {formatKg(open.kg)}
              </span>
              <span className="text-label text-text-secondary">کیلوگرم</span>
            </p>
            <Button
              variant="plain"
              className="mt-4 !text-danger"
              onClick={() => {
                const removed = removeWeight(open.id);
                setOpen(null);
                if (removed) toast("وزن حذف شد", { label: "برگردون", run: () => restoreWeight(removed) });
              }}
            >
              <Trash size={18} />
              حذف این وزن
            </Button>
          </div>
        ) : null}
      </Sheet>
    </>
  );
}
