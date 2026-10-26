"use client";

import { GuideGrid, useRecentSymptoms } from "./GuideGrid";
import { MealsCard } from "./MealsCard";
import { NutritionHero } from "./NutritionHero";
import { RecipeCard } from "./RecipeCard";
import { WaterPips } from "./WaterPips";
import { WeekProtein } from "./WeekProtein";
import { AppHeader } from "@/components/app/AppHeader";
import { Screen } from "@/components/app/Screen";
import { Shelf } from "@/components/app/Shelf";
import { LessonRow } from "@/components/app/learn/LessonRow";
import { Card, SectionTitle } from "@/components/ui/Card";
import { useAppData, waterOn } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { guidesFor } from "@/lib/food-guide";
import { isoOf } from "@/lib/jalali";
import { findLesson } from "@/lib/learn";
import { targetsFor } from "@/lib/nutrition";
import { useOnboarding } from "@/lib/onboarding-store";
import { RECIPE_TAGS, RECIPES, type RecipeTag } from "@/lib/recipes";
import { useNow } from "@/lib/use-now";

/**
 * تغذیه: today against the targets with the camera one tap away, today's meals and water, this
 * week's protein, what to eat for each side effect, recipes, and the food lessons. The recipes
 * shown are the ones that suit the person now (gentle after stomach symptoms, fiber after
 * constipation, protein otherwise); every recipe, with filters, is one tap further.
 */
export function FoodScreen() {
  const now = useNow();
  if (!now) return null;
  return <Food today={isoOf(now)} />;
}

function Food({ today }: { today: string }) {
  const o = useOnboarding();
  const { water, weights } = useAppData();
  const targets = targetsFor(o, weights);
  const glasses = waterOn(water, today);
  const recent = useRecentSymptoms(today);
  const forYou = guidesFor(recent)[0];
  const tag: RecipeTag = forYou?.recipeTag ?? "protein";
  const recipes = RECIPES.filter((r) => r.tags.includes(tag));
  const why = RECIPE_TAGS.find((t) => t.value === tag)!;

  return (
    <Screen>
      <AppHeader title="تغذیه" caption="ثبت غذا، راهنما و دستور پخت" />

      <div className="flex flex-col gap-4 px-4">
        <NutritionHero today={today} />

        <section aria-labelledby="meals-title" className="pt-2">
          <SectionTitle id="meals-title">وعده‌های امروز</SectionTitle>
          <div className="flex flex-col gap-3">
            <MealsCard date={today} />
            <Card className="p-4">
              <div className="mb-3 flex items-baseline justify-between px-0.5">
                <h3 className="text-body-strong text-text-primary">آب</h3>
                <span className="text-caption text-text-secondary">
                  {toFaDigits(glasses)} از {toFaDigits(targets.water)} لیوان
                </span>
              </div>
              <WaterPips date={today} target={targets.water} />
            </Card>
          </div>
        </section>

        <section aria-labelledby="week-title" className="pt-2">
          <SectionTitle id="week-title">پروتئین این هفته</SectionTitle>
          <WeekProtein today={today} />
        </section>

        <section aria-labelledby="guide-title" className="pt-2">
          <SectionTitle id="guide-title">حالت خوب نیست؟ چی بخوری</SectionTitle>
          <GuideGrid today={today} />
        </section>

        <section aria-labelledby="recipes-title" className="pt-2">
          <SectionTitle id="recipes-title" href="/food/recipes">
            دستور پخت
          </SectionTitle>
          <p className="-mt-1.5 mb-3 px-1 text-caption text-text-secondary">
            {forYou ? `برای ${forYou.title} این روزهات: ` : "پیشنهاد امروز: "}
            <span className="text-text-brand">{why.label}</span>
          </p>
          <Shelf label="دستورهای پیشنهادی">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} shelf />
            ))}
          </Shelf>
        </section>

        <section aria-labelledby="learn-title" className="pt-2">
          <SectionTitle id="learn-title" href="/learn">
            یادگیری تغذیه
          </SectionTitle>
          <Card className="divide-y divide-violet-100 overflow-hidden">
            {["protein", "small-meals", "hydration"].map((id) => (
              <LessonRow key={id} lesson={findLesson(id)!} />
            ))}
          </Card>
        </section>

        <p className="px-4 pt-1 text-center text-caption text-balance text-text-tertiary">
          عددها تخمینی‌ان. برای برنامه‌ی غذایی دقیق، با متخصص تغذیه یا پزشکت مشورت کن.
        </p>
      </div>
    </Screen>
  );
}
