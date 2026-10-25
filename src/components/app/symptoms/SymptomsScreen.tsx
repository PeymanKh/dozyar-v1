"use client";

import Image from "next/image";
import { useState } from "react";
import { LogHero } from "./LogHero";
import { InsightSummary, MoodTrend } from "./MoodAnalysis";
import { MoodWeek } from "./MoodWeek";
import { MonthHeatmap } from "./MonthHeatmap";
import { CycleInsight, SymptomFrequency } from "./SymptomInsights";
import { AppHeader } from "@/components/app/AppHeader";
import { DaySheet } from "@/components/app/DaySheet";
import { Screen } from "@/components/app/Screen";
import { Card, SectionTitle } from "@/components/ui/Card";
import { AlertCircle } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/Segmented";
import { useAppData } from "@/lib/app-store";
import { addDays, isoOf } from "@/lib/jalali";
import { useOnboarding } from "@/lib/onboarding-store";
import { rhythmOf } from "@/lib/plan";
import { periodSummary } from "@/lib/stats";
import { RED_FLAG_NOTE, RED_FLAG_SYMPTOMS } from "@/lib/symptoms";
import { useNow } from "@/lib/use-now";
import journalIcon from "../../../../public/app/journal.png";

type Period = "7" | "30" | "90";
const PERIODS: { value: Period; label: string }[] = [
  { value: "7", label: "۷ روز" },
  { value: "30", label: "۳۰ روز" },
  { value: "90", label: "۹۰ روز" },
];

/**
 * How the person feels, in two clear halves. Logging first: today on the brand card, and
 * this week by face with «+» on the days still open. Then analysis for the chosen period:
 * a plain-language summary, mood over time, the most common symptoms; and the patterns that
 * need all the data: symptoms through the injection cycle and the calendar.
 */
export function SymptomsScreen() {
  const now = useNow();
  const o = useOnboarding();
  const { checkIns } = useAppData();
  const [day, setDay] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30");
  if (!now) return null;

  const today = isoOf(now);
  const todayCheckIn = checkIns.find((c) => c.date === today);
  const redFlag = RED_FLAG_SYMPTOMS.some((id) => todayCheckIn?.symptoms[id] === 3);
  const days = Number(period);
  const from = addDays(today, -(days - 1));
  const summary = periodSummary(checkIns, from, today);
  const weekly = rhythmOf(o.medication) === "weekly";

  return (
    <Screen>
      <AppHeader title="حال من" caption="ثبت حال روزانه و تحلیل علائم" />

      <div className="flex flex-col gap-4 px-4">
        <LogHero today={today} checkIn={todayCheckIn} />
        {redFlag ? (
          <p
            role="note"
            className="flex items-start gap-2 rounded-[20px] bg-danger-subtle px-4 py-3.5 text-caption text-text-primary"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger" />
            {RED_FLAG_NOTE}
          </p>
        ) : null}
        <MoodWeek today={today} onOpen={setDay} />

        <section aria-labelledby="analysis-title" className="flex flex-col gap-3 pt-3">
          <SectionTitle id="analysis-title">تحلیل</SectionTitle>
          {checkIns.length ? (
            <>
              <div className="-mt-2.5">
                <Segmented label="بازه‌ی تحلیل" value={period} onChange={setPeriod} options={PERIODS} />
              </div>
              <InsightSummary summary={summary} />
              <MoodTrend from={from} to={today} summary={summary} />
              <SymptomFrequency today={today} days={days} />
            </>
          ) : (
            <Card className="flex flex-col items-center p-6 text-center">
              <div className="relative mb-3 grid size-20 place-items-center">
                <div aria-hidden="true" className="halo absolute -inset-3" />
                <Image src={journalIcon} alt="" width={72} height={72} className="relative size-18 object-contain" />
              </div>
              <p className="text-body-strong text-text-primary">تحلیلت از اولین ثبت شروع می‌شه</p>
              <p className="mt-1 text-caption text-balance text-text-secondary">
                چند روز که حالت رو ثبت کنی، اینجا می‌بینی حالت چطور تغییر کرده، کدوم علائم بیشترن و چه ربطی به تزریق
                دارن.
              </p>
            </Card>
          )}
        </section>

        {checkIns.length ? (
          <section aria-labelledby="patterns-title" className="flex flex-col gap-3 pt-3">
            <SectionTitle id="patterns-title">الگوی علائم</SectionTitle>
            <div className="-mt-2.5 flex flex-col gap-3">
              {weekly ? <CycleInsight /> : null}
              <MonthHeatmap today={today} onPick={setDay} />
            </div>
          </section>
        ) : null}
      </div>

      <DaySheet date={day} today={today} onClose={() => setDay(null)} />
    </Screen>
  );
}
