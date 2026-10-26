"use client";

import { CountdownRing } from "@/components/app/CountdownRing";
import { HeroActions, HeroButton, HeroFrame } from "@/components/app/HeroCard";
import { Meter } from "@/components/app/Meter";
import { Camera } from "@/components/ui/icons";
import { useAppData, waterOn } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { dayNutrients, formatGrams, share, targetsFor } from "@/lib/nutrition";
import { useOnboarding } from "@/lib/onboarding-store";
import { openMeal, pickMealPhoto } from "@/lib/ui-store";

/**
 * The one main thing on تغذیه, on the brand card: today against the targets. Protein is the
 * ring (the nutrient that matters most on these medicines), fiber and water are meters, and the
 * main action takes a photo of a meal. No calorie goal, on purpose.
 */
export function NutritionHero({ today }: { today: string }) {
  const o = useOnboarding();
  const { meals, water, weights } = useAppData();
  const t = targetsFor(o, weights);
  const day = dayNutrients(meals, today);
  const glasses = waterOn(water, today);
  const left = Math.max(0, t.protein - day.protein);

  return (
    <HeroFrame label="تغذیه‌ی امروز">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-caption text-white/80">پروتئین امروز</p>
          <h2 className="mt-0.5 font-display text-[20px] leading-snug font-bold">
            {day.protein === 0 ? "هنوز چیزی ثبت نشده" : left > 0 ? `${formatGrams(left)} گرم تا هدف` : "به هدفت رسیدی!"}
          </h2>
          <div className="mt-3 flex flex-col gap-2.5">
            <Meter
              tone="light"
              label="فیبر"
              value={day.fiber}
              target={t.fiber}
              valueLabel={`${formatGrams(day.fiber)} از ${toFaDigits(t.fiber)} گرم`}
            />
            <Meter
              tone="light"
              label="آب"
              value={glasses}
              target={t.water}
              valueLabel={`${toFaDigits(glasses)} از ${toFaDigits(t.water)} لیوان`}
            />
          </div>
        </div>
        <CountdownRing
          tone="light"
          size={104}
          progress={share(day.protein, t.protein)}
          primary={formatGrams(day.protein)}
          secondary={`از ${toFaDigits(t.protein)} گرم`}
        />
      </div>
      <HeroActions>
        <HeroButton onClick={pickMealPhoto}>
          <span className="flex items-center justify-center gap-2">
            <Camera size={19} />
            عکس غذا
          </span>
        </HeroButton>
        <HeroButton quiet onClick={() => openMeal({ kind: "manual" })}>
          بدون عکس
        </HeroButton>
      </HeroActions>
    </HeroFrame>
  );
}
