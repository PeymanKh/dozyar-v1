"use client";

import { useSyncExternalStore } from "react";
import { isoOfJalali } from "./jalali";
import type { MealType, Nutrients } from "./nutrition";
import type { InjectionSite, OnboardingState } from "./onboarding-store";
import type { Appetite, Mood, SymptomId } from "./symptoms";

/**
 * Everything logged after onboarding: injections, weights, daily check-ins, waist
 * measurements, meals and water. Lives in memory and mirrors to localStorage (same pattern as
 * the onboarding store). Dates are Gregorian ISO "YYYY-MM-DD", times "HH:MM", shown as Jalali.
 *
 * MOCK: moves to the Django API once it exists.
 */

export type InjectionLog = { id: string; date: string; time: string; mg: number | null; site: InjectionSite | null };
export type WeightLog = { id: string; date: string; kg: number };
export type CheckIn = {
  date: string;
  mood: Mood;
  symptoms: Partial<Record<SymptomId, 1 | 2 | 3>>;
  appetite?: Appetite;
  note?: string;
};
export type Measurement = { id: string; date: string; waistCm: number };

/**
 * One food in a meal: what it is, how many of its unit («۲ کفگیر»), and its nutrients per unit,
 * copied in when logged so a meal keeps its numbers even if the food list changes.
 */
export type MealItem = {
  /** From the food list, or null for something typed in. */
  foodId: string | null;
  name: string;
  emoji: string;
  unit: string;
  amount: number;
  per: Nutrients;
};

export type MealLog = {
  id: string;
  date: string;
  time: string;
  type: MealType;
  /** What the meal is called, e.g. «چلو مرغ» (from the photo or the recipe). */
  title?: string;
  items: MealItem[];
  /** The photo, kept on the phone (meal-photos). */
  photoId?: string;
  source: "photo" | "manual" | "recipe";
  recipeId?: string;
};

/** Glasses of water on a day (one entry per day). */
export type WaterLog = { date: string; glasses: number };

export type AppData = {
  /** Set once the onboarding answers have been turned into the first logs. */
  seeded: boolean;
  injections: InjectionLog[];
  weights: WeightLog[];
  checkIns: CheckIn[];
  measurements: Measurement[];
  meals: MealLog[];
  water: WaterLog[];
};

const KEY = "dozyar.data";
const EMPTY: AppData = {
  seeded: false,
  injections: [],
  weights: [],
  checkIns: [],
  measurements: [],
  meals: [],
  water: [],
};
const listeners = new Set<() => void>();
let state: AppData | null = null;

function read(): AppData {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    state = EMPTY;
  }
  return state!;
}

function write(next: AppData) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable; keep the in-memory copy
  }
  listeners.forEach((l) => l());
}

function update(fn: (d: AppData) => AppData) {
  write(fn(read()));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** The data right now, outside render (event handlers, timers). */
export function readAppData(): AppData {
  return read();
}

/** crypto.randomUUID needs a secure context, which a phone on the LAN (http) is not. */
export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

const byDateTime = <T extends { date: string; time?: string }>(a: T, b: T) =>
  a.date === b.date ? (a.time ?? "").localeCompare(b.time ?? "") : a.date.localeCompare(b.date);

// Injections

export function logInjection(entry: Omit<InjectionLog, "id">): InjectionLog {
  const log = { ...entry, id: newId() };
  update((d) => ({ ...d, injections: [...d.injections, log].sort(byDateTime) }));
  return log;
}

export function removeInjection(id: string): InjectionLog | undefined {
  const removed = read().injections.find((i) => i.id === id);
  update((d) => ({ ...d, injections: d.injections.filter((i) => i.id !== id) }));
  return removed;
}

export function restoreInjection(log: InjectionLog) {
  update((d) => ({ ...d, injections: [...d.injections, log].sort(byDateTime) }));
}

// Weights (one per day: logging again the same day replaces it)

export function logWeight(date: string, kg: number): WeightLog {
  const log = { id: newId(), date, kg };
  update((d) => ({ ...d, weights: [...d.weights.filter((w) => w.date !== date), log].sort(byDateTime) }));
  return log;
}

export function removeWeight(id: string): WeightLog | undefined {
  const removed = read().weights.find((w) => w.id === id);
  update((d) => ({ ...d, weights: d.weights.filter((w) => w.id !== id) }));
  return removed;
}

export function restoreWeight(log: WeightLog) {
  update((d) => ({ ...d, weights: [...d.weights.filter((w) => w.date !== log.date), log].sort(byDateTime) }));
}

// Check-ins (one per day)

export function saveCheckIn(checkIn: CheckIn) {
  update((d) => ({
    ...d,
    checkIns: [...d.checkIns.filter((c) => c.date !== checkIn.date), checkIn].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
  }));
}

export function removeCheckIn(date: string) {
  update((d) => ({ ...d, checkIns: d.checkIns.filter((c) => c.date !== date) }));
}

// Waist

export function logMeasurement(date: string, waistCm: number): Measurement {
  const m = { id: newId(), date, waistCm };
  update((d) => ({ ...d, measurements: [...d.measurements.filter((x) => x.date !== date), m].sort(byDateTime) }));
  return m;
}

export function restoreMeasurement(m: Measurement) {
  update((d) => ({ ...d, measurements: [...d.measurements.filter((x) => x.date !== m.date), m].sort(byDateTime) }));
}

export function removeMeasurement(id: string) {
  update((d) => ({ ...d, measurements: d.measurements.filter((m) => m.id !== id) }));
}

// Meals

export function logMeal(entry: Omit<MealLog, "id">): MealLog {
  const meal = { ...entry, id: newId() };
  update((d) => ({ ...d, meals: [...d.meals, meal].sort(byDateTime) }));
  return meal;
}

/** Replaces a meal with an edited copy (same id). */
export function saveMeal(meal: MealLog) {
  update((d) => ({ ...d, meals: [...d.meals.filter((m) => m.id !== meal.id), meal].sort(byDateTime) }));
}

export function removeMeal(id: string): MealLog | undefined {
  const removed = read().meals.find((m) => m.id === id);
  update((d) => ({ ...d, meals: d.meals.filter((m) => m.id !== id) }));
  return removed;
}

export function restoreMeal(meal: MealLog) {
  saveMeal(meal);
}

// Water

export function waterOn(water: WaterLog[], date: string): number {
  return water.find((w) => w.date === date)?.glasses ?? 0;
}

export function setWater(date: string, glasses: number) {
  const next = Math.max(0, Math.min(20, Math.round(glasses)));
  update((d) => ({
    ...d,
    water: [...d.water.filter((w) => w.date !== date), ...(next ? [{ date, glasses: next }] : [])].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
  }));
}

/**
 * Turn the onboarding answers into the first logs, once: today's weight, the starting weight
 * (dated at the start month when known), and the last injection for people already injecting.
 */
export function seedFromOnboarding(o: OnboardingState, today: string) {
  if (read().seeded) return;
  const weights: WeightLog[] = [];
  const injections: InjectionLog[] = [];
  if (o.weight) {
    if (typeof o.weight.start === "number" && o.schedule?.startedAt) {
      const startDate = isoOfJalali({ ...o.schedule.startedAt, jd: 1 });
      if (startDate < today) weights.push({ id: newId(), date: startDate, kg: o.weight.start });
    }
    weights.push({ id: newId(), date: today, kg: o.weight.today });
  }
  if (o.schedule?.lastDose) {
    injections.push({
      id: newId(),
      date: o.schedule.lastDose,
      time: o.schedule.time,
      mg: o.dose && "mg" in o.dose ? o.dose.mg : null,
      site: o.schedule.lastSite ?? null,
    });
  }
  update((d) => ({ ...d, seeded: true, weights: [...d.weights, ...weights].sort(byDateTime), injections }));
}

export function replaceAppData(next: AppData) {
  write(next);
}

export function resetAppData() {
  write(EMPTY);
}
