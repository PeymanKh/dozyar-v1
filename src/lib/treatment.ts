/**
 * The treatment as it actually happens: when the next dose is due (from the last logged
 * injection), where to inject next, which doses were taken when, and since when.
 * Pure functions over the onboarding answers and the logs; nothing here suggests a dose.
 */

import type { InjectionLog } from "./app-store";
import { addDays, daysBetween, dateOf, isoOf, isoOfJalali } from "./jalali";
import type { Rhythm } from "./medications";
import type { InjectionSite, OnboardingState } from "./onboarding-store";
import { nextDoseAt, rhythmOf, SITES } from "./plan";

export const INTERVAL_DAYS: Record<Rhythm, number> = { weekly: 7, daily: 1 };

export function currentDoseMg(o: OnboardingState): number | null {
  return o.dose && "mg" in o.dose ? o.dose.mg : null;
}

export function hasDrug(o: OnboardingState): boolean {
  return !!o.medication && !("pending" in o.medication);
}

function at(iso: string, time: string): Date {
  const d = dateOf(iso);
  const [h, m] = time.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export type DoseState =
  | { kind: "no-drug" }
  | { kind: "no-schedule" }
  | {
      /** upcoming: later than today; today: due today; late: the due day has passed */
      kind: "upcoming" | "today" | "late";
      /** No injection logged yet: the next one is the first. */
      first: boolean;
      /** An injection was logged today. */
      loggedToday: boolean;
      due: string;
      time: string;
      /** due - today in days; negative when late. */
      daysLeft: number;
      dueAt: Date;
      rhythm: Rhythm;
    };

/**
 * The next dose is one interval (a week or a day) after the last logged injection, at the
 * planned time. Before the first log, it comes from the onboarding schedule.
 */
export function doseState(o: OnboardingState, injections: InjectionLog[], now: Date): DoseState {
  if (!hasDrug(o)) return { kind: "no-drug" };
  const s = o.schedule;
  if (!s) return { kind: "no-schedule" };
  const rhythm = rhythmOf(o.medication);
  const today = isoOf(now);
  const last = injections.at(-1);
  const time = s.time;

  let due: string;
  if (last) due = addDays(last.date, INTERVAL_DAYS[rhythm]);
  else if (s.firstDose) due = s.firstDose;
  else due = isoOf(nextDoseAt(s, rhythm, now));

  const daysLeft = daysBetween(today, due);
  const kind = daysLeft > 0 ? "upcoming" : daysLeft === 0 ? "today" : "late";
  return {
    kind,
    first: !last,
    loggedToday: last?.date === today,
    due,
    time,
    daysLeft,
    dueAt: at(due, time),
    rhythm,
  };
}

/** Share of the cycle already passed (0..1) for the countdown ring. */
export function cycleProgress(state: Extract<DoseState, { due: string }>, now: Date): number {
  const cycle = INTERVAL_DAYS[state.rhythm] * 86_400_000;
  const left = state.dueAt.getTime() - now.getTime();
  return Math.min(1, Math.max(0.04, 1 - left / cycle));
}

/**
 * Where to inject next: a spot not used yet, otherwise the one rested longest. Starts the
 * search after the last spot, so the rotation goes around the body in a steady order.
 */
export function suggestSite(injections: InjectionLog[]): InjectionSite {
  const lastUsed = new Map<InjectionSite, string>();
  for (const i of injections) if (i.site) lastUsed.set(i.site, `${i.date}T${i.time}`);
  const last = injections.findLast((i) => i.site)?.site;
  const from = last ? SITES.findIndex((s) => s.value === last) + 1 : 0;
  const order = SITES.map((_, k) => SITES[(from + k) % SITES.length].value);
  return order.reduce((best, site) => ((lastUsed.get(site) ?? "") < (lastUsed.get(best) ?? "") ? site : best));
}

/** How many of the last `n` injections went to each spot. */
export function recentSiteUse(injections: InjectionLog[], n = 6): Map<InjectionSite, number> {
  const use = new Map<InjectionSite, number>();
  for (const i of injections.slice(-n)) if (i.site) use.set(i.site, (use.get(i.site) ?? 0) + 1);
  return use;
}

/** Runs of the same dose, oldest first: «۰٫۲۵ میلی‌گرم از ۱ مهر، ۴ بار». */
export function doseSteps(
  injections: InjectionLog[],
): { mg: number | null; from: string; to: string; count: number }[] {
  const steps: { mg: number | null; from: string; to: string; count: number }[] = [];
  for (const i of injections) {
    const step = steps.at(-1);
    if (step && step.mg === i.mg) {
      step.count++;
      step.to = i.date;
    } else steps.push({ mg: i.mg, from: i.date, to: i.date, count: 1 });
  }
  return steps;
}

/**
 * When the treatment started: the first logged injection, or the month given in onboarding
 * (whichever is earlier), or the planned first dose. null when nothing is known.
 */
export function treatmentStart(o: OnboardingState, injections: InjectionLog[]): string | null {
  const firstLog = injections[0]?.date;
  const startedAt = o.schedule?.startedAt ? isoOfJalali({ ...o.schedule.startedAt, jd: 1 }) : undefined;
  const known = [firstLog, startedAt].filter((d): d is string => !!d).sort()[0];
  return known ?? o.schedule?.firstDose ?? null;
}

/** Injections logged vs expected in a date range, for adherence in the report. */
export function adherence(injections: InjectionLog[], rhythm: Rhythm, from: string, to: string) {
  const logged = injections.filter((i) => i.date >= from && i.date <= to).length;
  const days = daysBetween(from, to) + 1;
  const expected = Math.max(1, Math.round(days / INTERVAL_DAYS[rhythm]));
  return { logged, expected };
}
