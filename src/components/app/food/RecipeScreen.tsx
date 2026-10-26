"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { DishTile } from "./FoodThumb";
import { AppHeader } from "@/components/app/AppHeader";
import { Screen } from "@/components/app/Screen";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Check, Clock, Lightbulb, Minus, Plus, Users } from "@/components/ui/icons";
import { logMeal, removeMeal } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { isoOf } from "@/lib/jalali";
import { clockNow, formatAmount, formatGrams, formatKcal, MEAL_LABEL, mealTypeAt } from "@/lib/nutrition";
import { findRecipe, TAG_LABEL, type Ingredient } from "@/lib/recipes";
import { haptic, toast } from "@/lib/ui-store";

/** An ingredient's amount for this many servings: grams to the nearest 10, the rest to a quarter. */
function amountFor(i: Ingredient, factor: number): string | null {
  if (i.amount === null) return null;
  const v = i.amount * factor;
  const rounded = i.unit === "گرم" ? Math.max(10, Math.round(v / 10) * 10) : Math.max(0.25, Math.round(v * 4) / 4);
  return `${formatAmount(rounded)} ${i.unit ?? ""}`.trim();
}

/**
 * A recipe: the dish, time and servings, nutrients per serving, why it suits the treatment,
 * ingredients to tick off (scaled by the servings stepper), and the steps. «خوردمش» logs one
 * serving as a meal, with undo.
 */
export function RecipeScreen({ id }: { id: string }) {
  const recipe = findRecipe(id)!;
  const [servings, setServings] = useState(recipe.servings);
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const factor = servings / recipe.servings;
  const n = recipe.perServing;

  function logIt() {
    const now = new Date();
    const time = clockNow(now);
    const type = mealTypeAt(time);
    const meal = logMeal({
      date: isoOf(now),
      time,
      type,
      title: recipe.title,
      items: [{ foodId: null, name: recipe.title, emoji: recipe.emoji, unit: "پرس", amount: 1, per: n }],
      source: "recipe",
      recipeId: recipe.id,
    });
    haptic(12);
    toast(`به ${MEAL_LABEL[type]} امروز اضافه شد`, { label: "برگردون", run: () => removeMeal(meal.id) });
  }

  return (
    <Screen pushed>
      <AppHeader title={recipe.title} caption={recipe.summary} back />

      <div className="flex flex-col gap-4 px-4">
        <DishTile emoji={recipe.emoji} className="aspect-[16/9] w-full rounded-[28px] border border-violet-100 [&>span]:text-[72px]" />

        <ul className="flex flex-wrap gap-2" aria-label="درباره‌ی این دستور">
          <li className="flex h-9 items-center gap-1.5 rounded-full bg-surface px-3.5 text-caption text-text-primary shadow-card">
            <Clock size={15} className="text-text-brand" />
            {toFaDigits(recipe.minutes)} دقیقه
          </li>
          {recipe.tags.map((t) => (
            <li key={t} className="flex h-9 items-center rounded-full bg-surface-brand-subtle px-3.5 text-caption text-text-brand">
              {TAG_LABEL[t]}
            </li>
          ))}
        </ul>

        <Card className="p-5">
          <p className="text-caption text-text-secondary">هر پرس</p>
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-[30px] leading-tight font-bold text-text-primary">{formatGrams(n.protein)}</span>
            <span className="text-label text-text-secondary">گرم پروتئین</span>
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-violet-100 pt-3">
            {[
              { label: "فیبر", value: `${formatGrams(n.fiber)} گرم` },
              { label: "انرژی", value: `${formatKcal(n.kcal)} کیلوکالری` },
              { label: "کربوهیدرات", value: `${formatGrams(n.carbs)} گرم` },
              { label: "چربی", value: `${formatGrams(n.fat)} گرم` },
            ].map((c) => (
              <div key={c.label} className="flex items-baseline justify-between gap-2">
                <dt className="text-caption text-text-secondary">{c.label}</dt>
                <dd className="text-label text-text-primary">{c.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <p className="flex items-start gap-3 rounded-[22px] bg-surface-brand-subtle px-5 py-4 text-body-small text-pretty text-text-primary">
          <Lightbulb size={18} className="mt-1 shrink-0 text-text-brand" />
          {recipe.why}
        </p>

        <section aria-labelledby="ingredients-title" className="pt-2">
          <div className="flex items-center justify-between px-1 pb-2.5">
            <h2 id="ingredients-title" className="text-title-section text-text-primary">
              مواد لازم
            </h2>
            <div className="flex items-center gap-1" role="group" aria-label="تعداد نفر">
              <Step label="کمتر" onClick={() => setServings((s) => Math.max(1, s - 1))} disabled={servings <= 1}>
                <Minus size={16} />
              </Step>
              <span className="flex min-w-16 items-center justify-center gap-1 text-label text-text-primary" aria-live="polite">
                <Users size={15} className="text-text-brand" />
                {toFaDigits(servings)} نفر
              </span>
              <Step label="بیشتر" onClick={() => setServings((s) => Math.min(12, s + 1))}>
                <Plus size={16} />
              </Step>
            </div>
          </div>
          <Card className="divide-y divide-violet-100 overflow-hidden">
            {recipe.ingredients.map((ing, k) => {
              const on = checked.has(k);
              const amount = amountFor(ing, factor);
              return (
                <button
                  key={ing.name}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() =>
                    setChecked((prev) => {
                      const next = new Set(prev);
                      if (next.has(k)) next.delete(k);
                      else next.add(k);
                      return next;
                    })
                  }
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-start transition-colors active:bg-surface-brand-subtle"
                >
                  <span
                    aria-hidden="true"
                    className={`grid size-6 shrink-0 place-items-center rounded-full border transition-colors duration-200 ${
                      on ? "border-transparent bg-brand text-text-on-brand" : "border-violet-200"
                    }`}
                  >
                    {on ? <Check size={13} strokeWidth={3} /> : null}
                  </span>
                  <span className={`min-w-0 flex-1 text-body-small transition-colors ${on ? "text-text-tertiary line-through" : "text-text-primary"}`}>
                    {ing.name}
                  </span>
                  {amount ? <span className="shrink-0 text-label text-text-secondary">{amount}</span> : null}
                </button>
              );
            })}
          </Card>
        </section>

        <section aria-labelledby="steps-title" className="pt-2">
          <SectionTitle id="steps-title">طرز تهیه</SectionTitle>
          <ol className="flex flex-col gap-2.5">
            {recipe.steps.map((s, k) => (
              <li key={s} className="flex items-start gap-3 rounded-[20px] bg-surface p-4 shadow-[0_1px_2px_rgb(30_27_51/0.03)]">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-brand-soft font-display text-[14px] font-bold text-text-brand">
                  {toFaDigits(k + 1)}
                </span>
                <span className="text-body-small text-pretty text-text-primary">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <p className="px-4 text-center text-caption text-balance text-text-tertiary">
          عددها برای یه پرس و تخمینی‌ان.
        </p>

        <div className="sticky bottom-0 z-10 -mx-4 bg-linear-to-t from-bg-canvas from-70% to-bg-canvas/0 px-4 pt-6 pb-[max(env(safe-area-inset-bottom),16px)]">
          <Button onClick={logIt}>خوردمش؛ ثبتش کن</Button>
        </div>
      </div>
    </Screen>
  );
}

function Step({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.88 }}
      transition={{ type: "spring", bounce: 0, duration: 0.25 }}
      className="grid size-9 place-items-center rounded-full bg-surface-brand-subtle text-text-brand disabled:opacity-40"
    >
      {children}
    </motion.button>
  );
}
