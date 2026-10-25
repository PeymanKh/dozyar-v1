"use client";

import { useSyncExternalStore } from "react";
import type { Rhythm } from "./medications";

/**
 * Onboarding answers. Lives in memory and mirrors to localStorage, so a person who leaves
 * mid-way continues where they stopped (spec: "answers are saved as they go").
 * Storage can be unavailable (private mode), so every access is guarded and the in-memory
 * copy is the source of truth.
 *
 * MOCK: moves to the Django API once it exists.
 */

/** Screen 2. "not-started" plans the first dose; the other two are already injecting. */
export type Journey = "not-started" | "just-started" | "a-while";

/**
 * Screen 3. A drug from the list, one typed in through "my drug isn't listed", or
 * "not decided yet" (the doctor hasn't chosen; added later from Today).
 */
export type MedicationChoice = { id: string } | { customName: string; rhythm: Rhythm } | { pending: true };

/** Screen 4. A dose in mg, or "not sure" (Today later asks for it). */
export type DoseAnswer = { mg: number } | { unknown: true };

export type InjectionSite = "belly-right" | "belly-left" | "thigh-right" | "thigh-left" | "arm-right" | "arm-left";

/** Screen 5. Dates are Gregorian ISO "YYYY-MM-DD"; time is "HH:MM". */
export type ScheduleAnswer = {
  /** Weekly drugs only. 0 = Saturday ... 6 = Friday. */
  day: number | null;
  time: string;
  /** Not started yet. */
  firstDose?: string;
  /** Already injecting. */
  lastDose?: string;
  /** Already injecting, optional. null = "I don't remember". */
  lastSite?: InjectionSite | null;
  /** Already injecting, optional, approximate. */
  startedAt?: { jy: number; jm: number };
};

/** Screen 6. Birth year is Jalali. */
export type AboutAnswer = { sex: "female" | "male"; birthYear: number; height: number };

/** Screen 7. Weights in kg. `start` only for people already injecting; null = don't remember. */
export type WeightAnswer = { today: number; start?: number | null };

/** Screen 10. */
export type ReminderAnswer = {
  discreet: boolean;
  nightBefore: boolean;
  smsBackup: boolean;
  /** How reminders will arrive. "off" = skipped for now. */
  channel: "push" | "sms" | "off";
};

export type OnboardingState = {
  mobile: string | null;
  /** Screen 1. null = not answered yet, "" = skipped. */
  name: string | null;
  journey: Journey | null;
  medication: MedicationChoice | null;
  dose: DoseAnswer | null;
  schedule: ScheduleAnswer | null;
  about: AboutAnswer | null;
  weight: WeightAnswer | null;
  /** Screen 8. undefined = not answered yet, null = skipped. */
  goal?: number | null;
  /** Screen 9. null = not answered yet; [] = nothing or skipped. */
  worries: string[] | null;
  reminders: ReminderAnswer | null;
};

const KEY = "dozyar.onboarding";
const EMPTY: OnboardingState = {
  mobile: null,
  name: null,
  journey: null,
  medication: null,
  dose: null,
  schedule: null,
  about: null,
  weight: null,
  worries: null,
  reminders: null,
};
const listeners = new Set<() => void>();
let state: OnboardingState | null = null;

function read(): OnboardingState {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    state = EMPTY;
  }
  return state!;
}

export function setOnboarding(patch: Partial<OnboardingState>) {
  state = { ...read(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable; keep the in-memory copy
  }
  listeners.forEach((l) => l());
}

/** Signing out: forget every answer on this device. */
export function resetOnboarding() {
  state = EMPTY;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // storage unavailable
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useOnboarding(): OnboardingState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** People who are already injecting see extra fields on screens 5, 7 and 11. */
export function isInjecting(journey: Journey | null): boolean {
  return journey === "just-started" || journey === "a-while";
}

/** Where to continue after signing in: the first screen without an answer (spec: resume mid-way). */
export function resumeRoute(s: OnboardingState): string {
  if (s.name === null) return "/onboarding/name";
  if (!s.journey) return "/onboarding/journey";
  if (!s.medication) return "/onboarding/medication";
  if (!s.dose) return "/onboarding/dose";
  if (!s.schedule) return "/onboarding/schedule";
  if (!s.about) return "/onboarding/about";
  if (!s.weight) return "/onboarding/weight";
  if (s.goal === undefined) return "/onboarding/goal";
  if (s.worries === null) return "/onboarding/worries";
  if (!s.reminders) return "/onboarding/reminders";
  return "/today";
}

export function readOnboarding(): OnboardingState {
  return read();
}

/** False during server render and hydration, true once the client store is readable. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
