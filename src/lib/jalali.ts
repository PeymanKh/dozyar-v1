/**
 * Jalali (Persian) calendar helpers. Conversion follows the jalaali-js algorithm
 * (Borkowski's leap cycle). Dates are stored as Gregorian ISO "YYYY-MM-DD" strings and only
 * shown as Jalali. Weeks start on Saturday.
 */

import { toFaDigits } from "./digits";

const div = (a: number, b: number) => ~~(a / b);
const mod = (a: number, b: number) => a - ~~(a / b) * b;

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178,
];

function jalCal(jy: number) {
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;
  for (let i = 1; i < BREAKS.length; i++) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number) {
  const d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

export type JDate = { jy: number; jm: number; jd: number };

export function toJalali(gy: number, gm: number, gd: number): JDate {
  const jdn = g2d(gy, gm, gd);
  const g = d2g(jdn);
  let jy = g.gy - 621;
  const r = jalCal(jy);
  let k = jdn - g2d(g.gy, 3, r.march);
  if (k >= 0) {
    if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

export function toGregorian(jy: number, jm: number, jd: number) {
  const r = jalCal(jy);
  return d2g(g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1);
}

export function monthLength(jy: number, jm: number) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalCal(jy).leap === 0 ? 30 : 29;
}

export const MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];
/** Saturday first. */
export const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
export const WEEKDAY_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

/** Local calendar date as ISO, without time zone surprises. */
export function isoOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dateOf(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayIso(): string {
  return isoOf(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = dateOf(iso);
  d.setDate(d.getDate() + days);
  return isoOf(d);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((dateOf(b).getTime() - dateOf(a).getTime()) / 86_400_000);
}

/** 0 = Saturday ... 6 = Friday. */
export function weekdayOf(iso: string): number {
  return (dateOf(iso).getDay() + 1) % 7;
}

export function jalaliOf(iso: string): JDate {
  const d = dateOf(iso);
  return toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function isoOfJalali(j: JDate): string {
  const g = toGregorian(j.jy, j.jm, j.jd);
  return isoOf(new Date(g.gy, g.gm - 1, g.gd));
}

/** "پنجشنبه ۸ آبان" */
export function formatJalali(iso: string, withWeekday = true): string {
  const j = jalaliOf(iso);
  const day = `${toFaDigits(j.jd)} ${MONTHS[j.jm - 1]}`;
  return withWeekday ? `${WEEKDAYS[weekdayOf(iso)]} ${day}` : day;
}

/** «امروز» / «فردا» / «دیروز» / «پنجشنبه ۸ آبان» */
export function relativeDay(iso: string, today: string): string {
  const d = daysBetween(today, iso);
  if (d === 0) return "امروز";
  if (d === 1) return "فردا";
  if (d === -1) return "دیروز";
  return formatJalali(iso);
}

export function currentJalaliYear(): number {
  return jalaliOf(todayIso()).jy;
}
