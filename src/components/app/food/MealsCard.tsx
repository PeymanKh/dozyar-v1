"use client";

import Image from "next/image";
import { FoodThumb } from "./FoodThumb";
import { Card } from "@/components/ui/Card";
import { ChevronBack } from "@/components/ui/icons";
import { useAppData, type MealLog } from "@/lib/app-store";
import { formatGrams, MEAL_LABEL, mealNutrients, mealsOn } from "@/lib/nutrition";
import { formatTime } from "@/lib/plan";
import { openMeal } from "@/lib/ui-store";
import cameraIcon from "../../../../public/app/camera.png";

/** What a meal is called: its title, or its foods. */
export function mealTitle(meal: MealLog): string {
  return meal.title ?? meal.items.map((i) => i.name).join("، ");
}

/** The meals of a day, in time order; tapping one opens it to change or delete. */
export function MealsCard({ date }: { date: string }) {
  const { meals } = useAppData();
  const list = mealsOn(meals, date);

  if (!list.length) {
    return (
      <Card className="flex items-center gap-4 p-4 pe-5">
        <div className="relative grid size-16 shrink-0 place-items-center">
          <div aria-hidden="true" className="halo absolute -inset-2" />
          <Image src={cameraIcon} alt="" width={64} height={64} className="relative size-16 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body-strong text-text-primary">هنوز غذایی ثبت نشده</p>
          <p className="text-caption text-pretty text-text-secondary">
            از غذات عکس بگیر؛ پروتئین، فیبر و انرژی‌ش رو تخمین می‌زنیم و تو می‌تونی اصلاحش کنی.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-violet-100 overflow-hidden">
      {list.map((m) => (
        <MealRow key={m.id} meal={m} />
      ))}
    </Card>
  );
}

export function MealRow({ meal }: { meal: MealLog }) {
  const n = mealNutrients(meal);
  return (
    <button
      type="button"
      onClick={() => openMeal({ kind: "edit", mealId: meal.id })}
      aria-haspopup="dialog"
      className="flex min-h-[72px] w-full items-center gap-3 px-4 py-3 text-start transition-colors active:bg-surface-brand-subtle"
    >
      <FoodThumb photoId={meal.photoId} emoji={meal.items[0]?.emoji ?? "🍽️"} size={52} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-strong text-text-primary">{mealTitle(meal)}</span>
        <span className="block text-caption text-text-secondary">
          {MEAL_LABEL[meal.type]}، ساعت {formatTime(meal.time)}
        </span>
      </span>
      <span className="shrink-0 text-end">
        <span className="block font-display text-[17px] leading-tight font-bold text-text-primary">
          {formatGrams(n.protein)}
          <span className="ms-0.5 text-caption font-medium text-text-secondary">گرم</span>
        </span>
        <span className="block text-caption-small text-text-tertiary">پروتئین</span>
      </span>
      <ChevronBack size={18} className="shrink-0 text-text-tertiary" aria-hidden="true" />
    </button>
  );
}
