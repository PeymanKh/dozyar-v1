"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { PhotosCard } from "./PhotosCard";
import { JourneyCard, WaistCard, WeekSummary, WeightCard, WeightHistory } from "./ProgressCards";
import { AppHeader } from "@/components/app/AppHeader";
import { Screen } from "@/components/app/Screen";
import { SectionTitle } from "@/components/ui/Card";
import { OptionCard } from "@/components/ui/OptionCard";
import { isoOf } from "@/lib/jalali";
import { useNow } from "@/lib/use-now";
import reportIcon from "../../../../public/app/report.png";

/**
 * Progress: the journey to the goal, weight over time next to the injections, this week in
 * numbers, waist, photos, every weigh-in, and the report for the doctor.
 */
export function ProgressScreen() {
  const router = useRouter();
  const now = useNow();
  if (!now) return null;
  const today = isoOf(now);

  return (
    <Screen>
      <AppHeader title="پیشرفت" caption="وزن، اندازه‌ها و عکس‌ها" />

      <div className="flex flex-col gap-4 px-4">
        <JourneyCard />
        <WeightCard today={today} />

        <div className="pt-2">
          <SectionTitle>این هفته</SectionTitle>
          <WeekSummary today={today} now={now} />
        </div>

        <div className="pt-2">
          <SectionTitle>اندازه‌ها و عکس‌ها</SectionTitle>
          <div className="flex flex-col gap-3">
            <WaistCard />
            <PhotosCard />
          </div>
        </div>

        <div className="pt-2">
          <SectionTitle>همه‌ی وزن‌ها</SectionTitle>
          <WeightHistory />
        </div>

        <OptionCard
          opens
          icon={<Image src={reportIcon} alt="" width={52} height={52} className="size-13 object-contain" />}
          title="گزارش برای پزشک"
          line="خلاصه‌ی درمان، وزن و علائمت برای ویزیت بعدی"
          onChoose={() => router.push("/report")}
        />
      </div>
    </Screen>
  );
}
