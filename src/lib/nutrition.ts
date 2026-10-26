/**
 * What the food screens count: protein, fiber, carbs, fat and energy per meal and per day,
 * the daily targets, and meal times. Pure functions over the logs.
 *
 * Targets are protein, fiber and water only. There is deliberately no calorie target: on these
 * medicines people already eat much less, and the risks are too little protein (muscle loss),
 * too little fiber and water (constipation), not too many calories. Energy is shown as
 * information, never as a goal.
 *
 * PENDING DIETITIAN REVIEW: the default targets below follow common published guidance for
 * people on GLP-1 medicines (protein around 1.2 g per kg, fiber 25–30 g, about 2 litres of
 * fluid) and are meant to be adjusted per person; the person can change them in Profile.
 */

import type { MealLog, WaterLog, WeightLog } from "./app-store";
import { toFaDigits } from "./digits";
import type { OnboardingState } from "./onboarding-store";

export type Nutrients = { kcal: number; protein: number; carbs: number; fat: number; fiber: number };

export const ZERO: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export function addNutrients(a: Nutrients, b: Nutrients): Nutrients {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber,
  };
}

export function scaleNutrients(n: Nutrients, k: number): Nutrients {
  return { kcal: n.kcal * k, protein: n.protein * k, carbs: n.carbs * k, fat: n.fat * k, fiber: n.fiber * k };
}

export function sumNutrients(list: Nutrients[]): Nutrients {
  return list.reduce(addNutrients, ZERO);
}

/** One item: its nutrients per unit times how many units. */
export function itemNutrients(item: { per: Nutrients; amount: number }): Nutrients {
  return scaleNutrients(item.per, item.amount);
}

export function mealNutrients(meal: Pick<MealLog, "items">): Nutrients {
  return sumNutrients(meal.items.map(itemNutrients));
}

export function mealsOn(meals: MealLog[], date: string): MealLog[] {
  return meals.filter((m) => m.date === date).sort((a, b) => a.time.localeCompare(b.time));
}

export function dayNutrients(meals: MealLog[], date: string): Nutrients {
  return sumNutrients(mealsOn(meals, date).map(mealNutrients));
}

/**
 * A period in numbers, for the doctor report: on how many days food was logged, and the
 * averages over those days only (a day without logs is missing data, not a day without food).
 */
export function periodNutrition(meals: MealLog[], water: WaterLog[], from: string, to: string) {
  const inRange = meals.filter((m) => m.date >= from && m.date <= to);
  const days = [...new Set(inRange.map((m) => m.date))];
  const totals = days.map((d) => dayNutrients(inRange, d));
  const avg = (pick: (n: Nutrients) => number) =>
    totals.length ? totals.reduce((sum, n) => sum + pick(n), 0) / totals.length : 0;
  const waterDays = water.filter((w) => w.date >= from && w.date <= to && w.glasses > 0);
  return {
    daysLogged: days.length,
    protein: avg((n) => n.protein),
    fiber: avg((n) => n.fiber),
    waterDays: waterDays.length,
    water: waterDays.length ? waterDays.reduce((sum, w) => sum + w.glasses, 0) / waterDays.length : 0,
  };
}

// Targets

export type Targets = { protein: number; fiber: number; water: number };

/** One glass, for the water count. */
export const GLASS_ML = 250;

const round5 = (n: number) => Math.round(n / 5) * 5;

/**
 * Suggested daily targets: protein from the goal weight (or today's weight when there is no
 * goal), 1.2 g per kg, kept between 60 and 120 g; fiber 25 g (30 g for men); 8 glasses of water.
 */
export function defaultTargets(o: OnboardingState, weights: WeightLog[]): Targets {
  const current = weights.at(-1)?.kg ?? o.weight?.today ?? 75;
  const reference = typeof o.goal === "number" ? o.goal : current;
  return {
    protein: Math.min(120, Math.max(60, round5(reference * 1.2))),
    fiber: o.about?.sex === "male" ? 30 : 25,
    water: 8,
  };
}

/** The person's own targets where they changed them, the suggestion otherwise. */
export function targetsFor(o: OnboardingState, weights: WeightLog[]): Targets {
  return { ...defaultTargets(o, weights), ...(o.nutritionTargets ?? {}) };
}

/** 0..1 of the way to a target. */
export function share(value: number, target: number): number {
  return target > 0 ? Math.min(1, Math.max(0, value / target)) : 0;
}

// Meals

export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

export const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "صبحانه" },
  { value: "lunch", label: "ناهار" },
  { value: "snack", label: "میان‌وعده" },
  { value: "dinner", label: "شام" },
];

export const MEAL_LABEL = Object.fromEntries(MEAL_TYPES.map((m) => [m.value, m.label])) as Record<MealType, string>;

/** The usual meal for a time of day ("HH:MM"): before 11 breakfast, 11–16 lunch, 16–19 a snack, then dinner. */
export function mealTypeAt(time: string): MealType {
  const h = Number(time.split(":")[0]);
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 19) return "snack";
  return "dinner";
}

/** "HH:MM" now, rounded down to five minutes. */
export function clockNow(now = new Date()): string {
  const m = now.getMinutes() - (now.getMinutes() % 5);
  return `${String(now.getHours()).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Formatting

/** Grams as people read them: whole grams, one decimal under 10 («۴٫۵»), «کمتر از ۱» near zero. */
export function formatGrams(g: number): string {
  if (g > 0 && g < 0.5) return "<۱";
  const text = g < 10 ? String(Math.round(g * 10) / 10) : String(Math.round(g));
  return toFaDigits(text).replace(".", "٫");
}

export function formatKcal(kcal: number): string {
  return toFaDigits(Math.round(kcal / 5) * 5);
}

/** «۱٫۵» for an amount of units (halves are common: «نصف کفگیر» is ۰٫۵). */
export function formatAmount(n: number): string {
  return toFaDigits(String(Math.round(n * 100) / 100)).replace(".", "٫");
}
