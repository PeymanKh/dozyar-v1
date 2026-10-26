"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AssistantCard } from "./AssistantCard";
import { DoseHero } from "./DoseHero";
import { LearnCard } from "./LearnCard";
import { NutritionCard } from "./NutritionCard";
import { TreatmentTile, WeightTile } from "./StatCards";
import { AppHeader } from "@/components/app/AppHeader";
import { CheckInCard } from "@/components/app/CheckInSummary";
import { Screen } from "@/components/app/Screen";
import { Info } from "@/components/ui/icons";
import { OptionCard, OptionGlyph } from "@/components/ui/OptionCard";
import { useAppData } from "@/lib/app-store";
import { formatJalali, isoOf } from "@/lib/jalali";
import { useOnboarding } from "@/lib/onboarding-store";
import { hasDrug } from "@/lib/treatment";
import { useNow } from "@/lib/use-now";
import reportIcon from "../../../../public/app/report.png";

/**
 * Today: the next injection first (the one thing that must not be missed), then today's food
 * (protein, fiber, water, the camera), how the person feels, weight and treatment so far, the
 * assistant with questions that fit today, the next lesson, and the doctor report.
 */
export function TodayScreen() {
  const router = useRouter();
  const now = useNow();
  const o = useOnboarding();
  const { checkIns } = useAppData();
  if (!now) return null;

  const today = isoOf(now);
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

        <NutritionCard today={today} />
        <CheckInCard checkIn={checkIns.find((c) => c.date === today)} date={today} />

        <div className="grid grid-cols-2 gap-3">
          <WeightTile />
          <TreatmentTile today={today} />
        </div>

        <AssistantCard now={now} />
        <LearnCard />

        <OptionCard
          opens
          icon={<Image src={reportIcon} alt="" width={52} height={52} className="size-13 object-contain" />}
          title="گزارش برای پزشک"
          line="خلاصه‌ی درمان، وزن، علائم و تغذیه برای ویزیت بعدی"
          onChoose={() => router.push("/report")}
        />
      </div>
    </Screen>
  );
}
