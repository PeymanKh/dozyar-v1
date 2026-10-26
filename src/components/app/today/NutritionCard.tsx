"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CountdownRing } from "@/components/app/CountdownRing";
import { FoodThumb } from "@/components/app/food/FoodThumb";
import { WaterPips } from "@/components/app/food/WaterPips";
import { Meter } from "@/components/app/Meter";
import { Card } from "@/components/ui/Card";
import { Camera, ChevronBack } from "@/components/ui/icons";
import { useAppData, waterOn } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { dayNutrients, formatGrams, mealsOn, share, targetsFor } from "@/lib/nutrition";
import { useOnboarding } from "@/lib/onboarding-store";
import { openMeal, pickMealPhoto } from "@/lib/ui-store";

/**
 * Today's food at a glance, where the week strip used to be: protein as a ring (the number that
 * matters most on these medicines), fiber as a meter, water as glasses to tap, today's meals as
 * small photos, and the camera. «همه» opens تغذیه.
 */
export function NutritionCard({ today }: { today: string }) {
  const o = useOnboarding();
  const { meals, water, weights } = useAppData();
  const t = targetsFor(o, weights);
  const day = dayNutrients(meals, today);
  const list = mealsOn(meals, today);
  const glasses = waterOn(water, today);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-title-section text-text-primary">تغذیه‌ی امروز</h2>
        <Link href="/food" className="-me-2 flex h-11 items-center gap-0.5 px-2 text-label text-text-brand">
          همه
          <ChevronBack size={16} />
        </Link>
      </div>

      <div className="mt-2 flex items-center gap-4">
        <CountdownRing
          size={92}
          progress={share(day.protein, t.protein)}
          primary={formatGrams(day.protein)}
          secondary={`از ${toFaDigits(t.protein)} گرم`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-caption text-text-secondary">پروتئین</p>
          <p className="text-body-strong text-text-primary">
            {day.protein >= t.protein
              ? "به هدف امروز رسیدی"
              : list.length
                ? `${formatGrams(t.protein - day.protein)} گرم دیگه`
                : "اولین وعده رو ثبت کن"}
          </p>
          <div className="mt-2.5">
            <Meter
              value={day.fiber}
              target={t.fiber}
              label="فیبر"
              valueLabel={`${formatGrams(day.fiber)} از ${toFaDigits(t.fiber)} گرم`}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-violet-100 pt-4">
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-caption text-text-secondary">آب</span>
          <span className="text-caption-small text-text-primary">
            {toFaDigits(glasses)} از {toFaDigits(t.water)} لیوان
          </span>
        </div>
        <WaterPips date={today} target={t.water} size={28} />
      </div>

      <div className="mt-4 flex items-center gap-2.5 border-t border-violet-100 pt-4">
        <motion.button
          type="button"
          onClick={pickMealPhoto}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-gradient px-5 text-label-button text-text-on-brand shadow-glow ${
            list.length ? "" : "flex-1"
          }`}
        >
          <Camera size={19} />
          عکس غذا
        </motion.button>
        {list.length ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden" aria-label="وعده‌های امروز">
            {list.slice(-4).map((m) => (
              <button
                key={m.id}
                type="button"
                aria-label={m.title ?? "وعده"}
                onClick={() => openMeal({ kind: "edit", mealId: m.id })}
                className="shrink-0 rounded-[14px] transition-transform active:scale-95"
              >
                <FoodThumb photoId={m.photoId} emoji={m.items[0]?.emoji ?? "🍽️"} size={44} radius={14} />
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openMeal({ kind: "manual" })}
            className="h-12 shrink-0 rounded-full px-3 text-label text-text-brand active:bg-surface-brand-subtle"
          >
            بدون عکس
          </button>
        )}
      </div>
    </Card>
  );
}
