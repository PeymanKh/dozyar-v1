/**
 * Numbers the progress and symptom screens show, computed from the logs.
 */

import type { AppData, CheckIn, InjectionLog, WeightLog } from "./app-store";
import { addDays, daysBetween, weekdayOf } from "./jalali";
import type { OnboardingState } from "./onboarding-store";
import { SYMPTOMS, type Appetite, type Severity, type SymptomId } from "./symptoms";

const round1 = (n: number) => Math.round(n * 10) / 10;

export type WeightSummary = {
  start: number;
  startDate: string | null;
  current: number;
  currentDate: string | null;
  goal: number | null;
  /** Positive when weight went down. */
  lost: number;
  lostPct: number;
  /** Left to the goal (0 once reached). */
  toGoal: number | null;
  /** 0..1 of the way from start to goal. */
  toGoalProgress: number | null;
};

/** Start, now and goal. The start is the earliest logged weight (or the onboarding answer). */
export function weightSummary(o: OnboardingState, weights: WeightLog[]): WeightSummary | null {
  const first = weights[0];
  const last = weights.at(-1);
  const start = first?.kg ?? o.weight?.start ?? o.weight?.today;
  const current = last?.kg ?? o.weight?.today;
  if (start === undefined || start === null || current === undefined) return null;
  const goal = typeof o.goal === "number" ? o.goal : null;
  const lost = round1(start - current);
  const span = goal !== null ? start - goal : 0;
  return {
    start,
    startDate: first?.date ?? null,
    current,
    currentDate: last?.date ?? null,
    goal,
    lost,
    lostPct: start ? round1((lost / start) * 100) : 0,
    toGoal: goal !== null ? Math.max(0, round1(current - goal)) : null,
    toGoalProgress: goal !== null && span > 0 ? Math.min(1, Math.max(0, (start - current) / span)) : null,
  };
}

/** The latest weight on or before a date. */
export function weightOn(weights: WeightLog[], date: string): number | null {
  return weights.findLast((w) => w.date <= date)?.kg ?? null;
}

/** Saturday to Friday around a date. */
export function weekOf(iso: string): string[] {
  const saturday = addDays(iso, -weekdayOf(iso));
  return Array.from({ length: 7 }, (_, i) => addDays(saturday, i));
}

export function worstSeverity(c: CheckIn | undefined): Severity {
  if (!c) return 0;
  return Math.max(0, ...Object.values(c.symptoms)) as Severity;
}

/** "حالت تهوع کم، خستگی متوسط" order follows the symptom list. */
export function symptomEntries(c: CheckIn): { id: SymptomId; severity: 1 | 2 | 3 }[] {
  return SYMPTOMS.flatMap((s) => (c.symptoms[s.id] ? [{ id: s.id, severity: c.symptoms[s.id]! }] : []));
}

/** Days since the last injection on or before a date (0 = injection day), or null. */
export function daysSinceInjection(injections: InjectionLog[], date: string): number | null {
  const last = injections.findLast((i) => i.date <= date);
  return last ? daysBetween(last.date, date) : null;
}

/**
 * How symptoms move through the injection cycle: average of each day's worst severity,
 * grouped by days since the injection (0..cycle-1). Days without a check-in are skipped.
 */
export function severityByCycleDay(data: AppData, cycle: number) {
  const sums = Array.from({ length: cycle }, () => ({ total: 0, days: 0 }));
  for (const c of data.checkIns) {
    const d = daysSinceInjection(data.injections, c.date);
    if (d === null || d >= cycle) continue;
    sums[d].total += worstSeverity(c);
    sums[d].days++;
  }
  return sums.map((s) => (s.days ? s.total / s.days : null));
}

/** Per symptom, on how many days it was logged and the worst it got, in a date range. */
export function symptomCounts(checkIns: CheckIn[], from: string, to: string) {
  const inRange = checkIns.filter((c) => c.date >= from && c.date <= to);
  return SYMPTOMS.map((s) => {
    const days = inRange.filter((c) => c.symptoms[s.id]);
    return {
      id: s.id,
      label: s.label,
      days: days.length,
      worst: Math.max(0, ...days.map((c) => c.symptoms[s.id]!)) as Severity,
    };
  })
    .filter((s) => s.days > 0)
    .sort((a, b) => b.days - a.days || b.worst - a.worst);
}

export function averageMood(checkIns: CheckIn[], from: string, to: string): number | null {
  const moods = checkIns.filter((c) => c.date >= from && c.date <= to).map((c) => c.mood);
  return moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
}

/** Weight change across a range: last weight in it minus the weight before it started. */
export function weightChange(weights: WeightLog[], from: string, to: string): number | null {
  const end = weightOn(weights, to);
  const before = weights.findLast((w) => w.date < from)?.kg ?? weights.find((w) => w.date >= from && w.date <= to)?.kg;
  if (end === null || before === undefined) return null;
  return round1(end - before);
}

export type PeriodSummary = {
  days: number;
  logged: number;
  mood: number | null;
  /** Average mood in the period of the same length just before. */
  prevMood: number | null;
  top: ReturnType<typeof symptomCounts>[number] | null;
  /** Days the top symptom was logged in the period before. */
  prevTopDays: number;
  /** Consecutive days up to today (or yesterday) logged with no symptoms. */
  calmStreak: number;
  appetite: Appetite | null;
};

/** What a period of check-ins says, next to the period of the same length before it. */
export function periodSummary(checkIns: CheckIn[], from: string, to: string): PeriodSummary {
  const days = daysBetween(from, to) + 1;
  const inRange = checkIns.filter((c) => c.date >= from && c.date <= to);
  const prevFrom = addDays(from, -days);
  const prevTo = addDays(from, -1);
  const top = symptomCounts(checkIns, from, to)[0] ?? null;
  const prevTopDays = top
    ? checkIns.filter((c) => c.date >= prevFrom && c.date <= prevTo && c.symptoms[top.id]).length
    : 0;

  const byDate = new Map(checkIns.map((c) => [c.date, c]));
  let day = byDate.has(to) ? to : addDays(to, -1);
  let calmStreak = 0;
  while (byDate.get(day) && worstSeverity(byDate.get(day)) === 0) {
    calmStreak++;
    day = addDays(day, -1);
  }

  const appetites = inRange.flatMap((c) => (c.appetite ? [c.appetite] : []));
  const appetite = appetites.length
    ? (["low", "normal", "high"] as Appetite[]).reduce((a, b) =>
        appetites.filter((x) => x === b).length > appetites.filter((x) => x === a).length ? b : a,
      )
    : null;

  return {
    days,
    logged: inRange.length,
    mood: averageMood(checkIns, from, to),
    prevMood: averageMood(checkIns, prevFrom, prevTo),
    top,
    prevTopDays,
    calmStreak,
    appetite,
  };
}
