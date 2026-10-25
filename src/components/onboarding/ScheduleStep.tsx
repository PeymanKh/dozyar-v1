"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { OptionCard } from "@/components/ui/OptionCard";
import { DateSheet, MonthSheet, SiteSheet, TimeSheet } from "@/components/ui/PickerSheets";
import { StepScreen } from "./StepScreen";
import { Button } from "@/components/ui/Button";
import { Info } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/Segmented";
import { toFaDigits } from "@/lib/digits";
import { addDays, formatJalali, isoOf, MONTHS, WEEKDAYS, weekdayOf } from "@/lib/jalali";
import { progressFor } from "@/lib/onboarding-flow";
import { isInjecting, setOnboarding, useOnboarding, type ScheduleAnswer } from "@/lib/onboarding-store";
import { formatTime, isDoseMissed, nextDoseAt, rhythmOf, SITES } from "@/lib/plan";
import { useNow, useToday } from "@/lib/use-now";
import scheduleIcon from "../../../public/onboarding/schedule.png";

const QUICK_TIMES = [
  { value: "09:00", label: "۹ صبح" },
  { value: "14:00", label: "۱۴ ظهر" },
  { value: "21:00", label: "۲۱ شب" },
];

type SheetName = "date" | "time" | "site" | "month" | null;

const reveal = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

/**
 * Screen 5 (required). The weekday is never asked: for weekly drugs it comes from the date
 * (the last or the first injection) and the preview card says it back. Past injections are
 * not counted here: the start month gives "week N of treatment", and every injection logged
 * from now on carries its dose, which builds the history.
 */
export function ScheduleStep() {
  const router = useRouter();
  const { journey, medication, schedule } = useOnboarding();
  const rhythm = rhythmOf(medication);
  const weekly = rhythm === "weekly";
  const injecting = isInjecting(journey);
  // Read in the browser only (Next prerenders this page and forbids `new Date()` there).
  const today = useToday();
  const now = useNow();
  const [draft, setDraft] = useState<Partial<ScheduleAnswer>>({});
  const [sheet, setSheet] = useState<SheetName>(null);
  const s: Partial<ScheduleAnswer> = { ...(schedule ?? {}), ...draft };
  const set = (patch: Partial<ScheduleAnswer>) => setDraft((d) => ({ ...d, ...patch }));

  const date = injecting ? s.lastDose : s.firstDose;
  const time = s.time;
  const ready = Boolean(date && time);
  const missed = injecting && today !== null && isDoseMissed(s.lastDose, rhythm);

  const quickDates = !today
    ? []
    : injecting
      ? [
          { label: "امروز", iso: today },
          { label: "دیروز", iso: addDays(today, -1) },
        ]
      : [
          { label: "امروز", iso: today },
          { label: "فردا", iso: addDays(today, 1) },
        ];
  const otherDate = date !== undefined && !quickDates.some((q) => q.iso === date);
  const customTime = time !== undefined && !QUICK_TIMES.some((q) => q.value === time);

  // The weekly day follows the date: the next injection falls on the same weekday.
  const day = weekly && date ? weekdayOf(date) : null;
  const next = date && time && now ? nextDoseAt({ day, time, firstDose: s.firstDose }, rhythm, now) : null;

  function pickDate(iso: string) {
    set(injecting ? { lastDose: iso } : { firstDose: iso });
  }

  function proceed() {
    if (!date || !time) return;
    setOnboarding({
      schedule: {
        day,
        time,
        ...(injecting ? { lastDose: s.lastDose, lastSite: s.lastSite, startedAt: s.startedAt } : { firstDose: s.firstDose }),
      },
    });
    router.push("/onboarding/about");
  }

  const dateQuestion = injecting ? "آخرین تزریقت کی بود؟" : "اولین تزریقت کیه؟";
  const siteLabel =
    s.lastSite === undefined ? null : s.lastSite === null ? "یادم نیست" : SITES.find((x) => x.value === s.lastSite)?.label;

  return (
    <StepScreen
      progress={progressFor(5)}
      // No drug chosen yet means the dose screen was skipped.
      backHref={medication && "pending" in medication ? "/onboarding/medication" : "/onboarding/dose"}
      icon={scheduleIcon}
      title="برنامه‌ی تزریقت"
      description={weekly ? "تا هر هفته به‌موقع یادت بندازیم." : "تا هر روز به‌موقع یادت بندازیم."}
      action={
        <Button disabled={!ready} onClick={proceed}>
          ادامه
        </Button>
      }
    >
      <div className="flex flex-col gap-6 pb-4">
        {/* The date */}
        <section role="radiogroup" aria-label={dateQuestion} className="flex flex-col gap-3">
          <h2 className="px-1 text-caption text-text-tertiary">{dateQuestion}</h2>
          {quickDates.map((q) => (
            <OptionCard
              key={q.iso}
              title={q.label}
              line={formatJalali(q.iso)}
              selected={date === q.iso}
              onChoose={() => pickDate(q.iso)}
            />
          ))}
          {today ? (
            <OptionCard
              title="یه روز دیگه"
              line={otherDate && date ? formatJalali(date) : "از تقویم انتخاب کن"}
              selected={otherDate}
              onChoose={() => setSheet("date")}
            />
          ) : null}
        </section>

        {/* The time */}
        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-caption text-text-tertiary">چه ساعتی؟</h2>
          <Segmented
            label="ساعت تزریق"
            value={time === undefined ? null : customTime ? "custom" : time}
            onChange={(v) => (v === "custom" ? setSheet("time") : set({ time: v }))}
            options={[...QUICK_TIMES, { value: "custom", label: customTime ? formatTime(time) : "ساعت دیگه" }]}
          />
        </section>

        {/* What the app understood: the next injection, or a missed-dose note */}
        <AnimatePresence initial={false} mode="popLayout">
          {missed ? (
            <motion.p
              key="missed"
              {...reveal}
              className="rounded-[20px] bg-surface-brand-subtle px-4 py-3.5 text-center text-caption text-balance text-text-brand"
            >
              <Info size={15} className="me-1.5 inline-block align-[-3px]" />
              به نظر می‌رسه یک دوز جا مونده. قبل از تزریق بعدی با پزشکت هماهنگ کن.
            </motion.p>
          ) : next && time ? (
            <motion.div key="next" {...reveal} className="rounded-[20px] bg-surface-brand-subtle px-4 py-3.5 text-center" aria-live="polite">
              <p className="text-caption text-text-secondary">{injecting ? "تزریق بعدی" : "اولین تزریق"}</p>
              <p className="text-body-strong text-text-primary">
                {formatJalali(isoOf(next))}، ساعت {formatTime(time)}
              </p>
              <p className="text-caption text-text-secondary">
                {weekly && day !== null ? `از این به بعد ${WEEKDAYS[day]}‌ها` : `هر روز ساعت ${formatTime(time)}`}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Optional details for people already injecting */}
        {injecting ? (
          <section aria-label="اختیاری" className="flex flex-col gap-3">
            <h2 className="px-1 text-caption text-text-tertiary">اختیاری</h2>
            <OptionCard opens title="جای آخرین تزریق" line={siteLabel ?? "برای پیشنهاد جای بعدی"} onChoose={() => setSheet("site")} />
            <OptionCard
              opens
              title="از کی شروع کردی؟"
              line={s.startedAt ? `${MONTHS[s.startedAt.jm - 1]} ${toFaDigits(s.startedAt.jy)}` : "تقریبی هم کافیه"}
              onChoose={() => setSheet("month")}
            />
          </section>
        ) : null}
      </div>

      <DateSheet
        open={sheet === "date"}
        onClose={() => setSheet(null)}
        title={dateQuestion}
        value={date}
        onChange={pickDate}
        min={today ? (injecting ? addDays(today, -120) : today) : undefined}
        max={today ? (injecting ? today : addDays(today, 120)) : undefined}
      />
      <TimeSheet open={sheet === "time"} onClose={() => setSheet(null)} value={time} onChange={(t) => set({ time: t })} />
      {injecting ? (
        <>
          <SiteSheet open={sheet === "site"} onClose={() => setSheet(null)} value={s.lastSite} onChange={(lastSite) => set({ lastSite })} />
          {today ? (
            <MonthSheet
              open={sheet === "month"}
              onClose={() => setSheet(null)}
              today={today}
              value={s.startedAt}
              onChange={(startedAt) => set({ startedAt })}
            />
          ) : null}
        </>
      ) : null}
    </StepScreen>
  );
}
