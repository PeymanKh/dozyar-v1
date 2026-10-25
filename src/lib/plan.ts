/**
 * What the app derives from onboarding answers: the drug's name and rhythm, readable times,
 * injection sites, the next dose and whether a dose was missed.
 */

import { toFaDigits } from "./digits";
import { addDays, dateOf, daysBetween, isoOf, todayIso, WEEKDAYS } from "./jalali";
import { findMedication, type Rhythm } from "./medications";
import type { DoseAnswer, InjectionSite, MedicationChoice, ScheduleAnswer } from "./onboarding-store";

/** Most of these drugs are weekly, so a drug not chosen yet is planned as weekly. */
export function rhythmOf(m: MedicationChoice | null): Rhythm {
  if (!m || "pending" in m) return "weekly";
  if ("id" in m) return findMedication(m.id)?.rhythm ?? "weekly";
  return m.rhythm;
}

/** "" when the drug isn't chosen yet. */
export function medicationName(m: MedicationChoice | null): string {
  if (!m || "pending" in m) return "";
  return "id" in m ? (findMedication(m.id)?.fa ?? "") : m.customName;
}

/** 0.25 -> "۰٫۲۵" */
export function formatMg(mg: number): string {
  return toFaDigits(String(mg)).replace(".", "٫");
}

/** 84.2 -> "۸۴٫۲", 80 -> "۸۰" (pass fixed for a scale readout: 80 -> "۸۰٫۰") */
export function formatKg(kg: number, fixed = false): string {
  const text = fixed ? kg.toFixed(1) : String(Math.round(kg * 10) / 10);
  return toFaDigits(text).replace(".", "٫");
}

export function doseLabel(d: DoseAnswer | null): string | null {
  return d && "mg" in d ? `${formatMg(d.mg)} میلی‌گرم` : null;
}

/** "21:00" -> "۲۱", "21:30" -> "۲۱:۳۰" (hours are 24h, as people write them in Persian) */
export function formatTime(time: string): string {
  const [h, m] = time.split(":");
  return toFaDigits(m === "00" ? String(Number(h)) : `${Number(h)}:${m}`);
}

/** "21:00" -> "۲۱:۰۰", for tables where times line up. */
export function formatClock(time: string): string {
  return toFaDigits(time);
}

export const SITES: { value: InjectionSite; label: string }[] = [
  { value: "belly-right", label: "شکم راست" },
  { value: "belly-left", label: "شکم چپ" },
  { value: "thigh-right", label: "ران راست" },
  { value: "thigh-left", label: "ران چپ" },
  { value: "arm-right", label: "بازو راست" },
  { value: "arm-left", label: "بازو چپ" },
];

/** A different spot from last time, in a fixed rotation. */
export function nextSite(last: InjectionSite): string {
  const i = SITES.findIndex((s) => s.value === last);
  return SITES[(i + 1) % SITES.length].label;
}

/** Days since the last dose that count as missed: a week (weekly) or two days (daily). */
export function isDoseMissed(lastDose: string | undefined, rhythm: Rhythm): boolean {
  if (!lastDose) return false;
  return daysBetween(lastDose, todayIso()) > (rhythm === "weekly" ? 7 : 2);
}

function at(iso: string, time: string): Date {
  const d = dateOf(iso);
  const [h, m] = time.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

/** When the next injection is due, from the schedule. */
export function nextDoseAt(s: ScheduleAnswer, rhythm: Rhythm, now = new Date()): Date {
  if (s.firstDose) {
    const first = at(s.firstDose, s.time);
    if (first > now) return first;
  }
  const today = isoOf(now);
  for (let i = 0; i <= 7; i++) {
    const iso = addDays(today, i);
    const candidate = at(iso, s.time);
    if (candidate <= now) continue;
    if (rhythm === "daily" || s.day === null || (dateOf(iso).getDay() + 1) % 7 === s.day) return candidate;
  }
  return at(addDays(today, 7), s.time);
}

/** "۳ روز" / "۶ ساعت" left, plus how much of the cycle has passed (for the ring). */
export function countdown(next: Date, rhythm: Rhythm, now = new Date()) {
  const ms = Math.max(0, next.getTime() - now.getTime());
  const hours = Math.ceil(ms / 3_600_000);
  const cycle = rhythm === "weekly" ? 7 * 24 : 24;
  const progress = Math.min(1, Math.max(0.04, 1 - ms / (cycle * 3_600_000)));
  // Whole days only from two days out; closer than that, hours are the honest unit.
  const inDays = rhythm === "weekly" && hours >= 48;
  const value = toFaDigits(inDays ? Math.floor(hours / 24) : hours);
  const unit = inDays ? "روز" : "ساعت";
  return { label: `${value} ${unit}`, value, unit, progress };
}

/** "پنجشنبه‌ها ۲۱" / "هر روز ۲۱" */
export function reminderLabel(s: ScheduleAnswer, rhythm: Rhythm): string {
  if (rhythm === "daily" || s.day === null) return `هر روز ${formatTime(s.time)}`;
  return `${WEEKDAYS[s.day]}‌ها ${formatTime(s.time)}`;
}

/** Lowest weight inside the healthy range (BMI 18.5) for a height. */
export function healthyFloorKg(cm: number): number {
  const m = cm / 100;
  return 18.5 * m * m;
}
