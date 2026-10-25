"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DoseHero } from "./DoseHero";
import { TreatmentTile, WeightTile } from "./StatCards";
import { TipCard } from "./TipCard";
import { WeekStrip } from "./WeekStrip";
import { AppHeader } from "@/components/app/AppHeader";
import { CheckInCard } from "@/components/app/CheckInSummary";
import { DaySheet } from "@/components/app/DaySheet";
import { Screen } from "@/components/app/Screen";
import { Info } from "@/components/ui/icons";
import { OptionCard, OptionGlyph } from "@/components/ui/OptionCard";
import { useAppData } from "@/lib/app-store";
import { formatJalali, isoOf } from "@/lib/jalali";
import { useOnboarding } from "@/lib/onboarding-store";
import { doseState, hasDrug } from "@/lib/treatment";
import { useNow } from "@/lib/use-now";
import reportIcon from "../../../../public/app/report.png";

/**
 * Today: the next injection first (the one thing that must not be missed), this week at a
 * glance, today's check-in, weight and treatment so far, one tip, and the doctor report.
 */
export function TodayScreen() {
  const router = useRouter();
  const now = useNow();
  const o = useOnboarding();
  const { injections, checkIns } = useAppData();
  const [day, setDay] = useState<string | null>(null);
  if (!now) return null;

  const today = isoOf(now);
  const state = doseState(o, injections, now);
  const due = "due" in state ? state.due : null;
  const name = o.name?.trim();
  const doseUnknown = hasDrug(o) && !(o.dose && "mg" in o.dose);

  return (
    <Screen>
      <AppHeader caption={formatJalali(today)} title={name ? `سلام، ${name}` : "سلام!"} compactTitle="امروز" />

      <div className="flex flex-col gap-4 px-4">
        <DoseHero now={now} />

        {doseUnknown ? (
          <OptionCard
            opens
            icon={
              <OptionGlyph>
                <Info size={20} />
              </OptionGlyph>
            }
            title="دوزت رو اضافه کن"
            line="برای ثبت دقیق تزریق‌ها و گزارش پزشک"
            onChoose={() => router.push("/treatment")}
          />
        ) : null}

        <WeekStrip today={today} due={due} onPick={setDay} />
        <CheckInCard checkIn={checkIns.find((c) => c.date === today)} date={today} />

        <div className="grid grid-cols-2 gap-3">
          <WeightTile />
          <TreatmentTile today={today} />
        </div>

        <TipCard today={today} />

        <OptionCard
          opens
          icon={<Image src={reportIcon} alt="" width={52} height={52} className="size-13 object-contain" />}
          title="گزارش برای پزشک"
          line="خلاصه‌ی درمان، وزن و علائمت برای ویزیت بعدی"
          onChoose={() => router.push("/report")}
        />
      </div>

      <DaySheet date={day} today={today} onClose={() => setDay(null)} />
    </Screen>
  );
}
