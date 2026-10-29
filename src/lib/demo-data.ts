/**
 * Ten weeks of believable sample data, built around the person's own answers (drug, dose,
 * time, weights), plus two weeks of meals and water, so every screen can be seen full. Deterministic: the same answers give the
 * same data. Symptoms peak a day or two after each injection and ease as the weeks go by,
 * which is the pattern people usually report on these medicines.
 *
 * Demo only. Replaces everything that was logged.
 */

import {
  newId,
  replaceAppData,
  type CheckIn,
  type InjectionLog,
  type MealLog,
  type Measurement,
  type WaterLog,
  type WeightLog,
} from "./app-store";
import { findFood, itemOf } from "./foods";
import { addDays, daysBetween, weekdayOf } from "./jalali";
import { setRead } from "./learn-store";
import { LESSON_PATH } from "./learn";
import { findMedication } from "./medications";
import { clockNow, type MealType } from "./nutrition";
import { readOnboarding, setOnboarding, type OnboardingState } from "./onboarding-store";
import { SITES } from "./plan";
import type { Appetite, Mood, SymptomId } from "./symptoms";
import { currentDoseMg } from "./treatment";

function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOTES = [
  "شام سبک خوردم و حالم بهتر بود.",
  "امروز نیم ساعت پیاده‌روی کردم.",
  "آب بیشتری خوردم، یبوستم بهتر شد.",
  "بعد از غذای چرب حالت تهوع داشتم.",
  "دیشب خوب خوابیدم.",
  "اشتهام خیلی کم بود، چند وعده‌ی کوچیک خوردم.",
];

// Chance of each symptom by days since a weekly injection (0 = injection day).
const WEEKLY_ODDS: Partial<Record<SymptomId, number[]>> = {
  nausea: [0.3, 0.6, 0.5, 0.3, 0.15, 0.1, 0.08],
  constipation: [0.08, 0.15, 0.3, 0.38, 0.3, 0.18, 0.1],
  fatigue: [0.25, 0.4, 0.28, 0.15, 0.1, 0.08, 0.08],
  heartburn: [0.05, 0.14, 0.12, 0.08, 0.04, 0.03, 0.03],
  headache: [0.04, 0.08, 0.06, 0.04, 0.04, 0.03, 0.03],
  diarrhea: [0.02, 0.07, 0.05, 0.02, 0.02, 0.01, 0.01],
  vomiting: [0.01, 0.04, 0.02, 0.01, 0, 0, 0],
  dizziness: [0.02, 0.03, 0.02, 0.02, 0.01, 0.01, 0.01],
};

// Meals people on these medicines actually log: smaller portions, protein most days.
type Plan = { title: string; items: [string, number][] };
const MEAL_PLANS: Record<MealType, Plan[]> = {
  breakfast: [
    { title: "نون و پنیر و گردو", items: [["sangak", 1.5], ["cheese", 1], ["walnut", 2]] },
    { title: "املت گوجه", items: [["omelet", 1], ["barbari", 1]] },
    { title: "تخم‌مرغ آب‌پز و نون", items: [["egg", 2], ["sangak", 1]] },
    { title: "فرنی جو دوسر و موز", items: [["oats", 1], ["banana", 0.5]] },
    { title: "ماست یونانی و موز", items: [["greek", 1], ["banana", 0.5]] },
  ],
  lunch: [
    { title: "چلو مرغ", items: [["polo", 1.5], ["chicken", 1], ["shirazi", 1]] },
    { title: "جوجه‌کباب با سالاد", items: [["joojeh", 1], ["polo", 1], ["salad", 1]] },
    { title: "قورمه‌سبزی با برنج", items: [["ghormeh", 1], ["polo", 1.5]] },
    { title: "عدس‌پلو و ماست", items: [["adaspolo", 0.5], ["yogurt", 1]] },
    { title: "ماهی و برنج", items: [["fish", 1], ["polo", 1], ["sabzi", 1]] },
  ],
  snack: [
    { title: "ماست و خیار", items: [["mastkhiar", 1]] },
    { title: "موز و بادام", items: [["banana", 1], ["almonds", 0.5]] },
    { title: "سیب", items: [["apple", 1]] },
    { title: "شیک موز و شیر", items: [["shake", 1]] },
  ],
  dinner: [
    { title: "عدسی", items: [["adasi", 1], ["sangak", 1]] },
    { title: "سوپ جو", items: [["soup", 1], ["toast", 1]] },
    { title: "کتلت و سالاد شیرازی", items: [["kotlet", 2], ["lavash", 1], ["shirazi", 1]] },
    { title: "نیمرو و سبزی", items: [["friedegg", 2], ["sangak", 1], ["sabzi", 1]] },
    { title: "جوجه‌کباب با سالاد", items: [["joojeh", 1], ["salad", 1]] },
  ],
};
const MEAL_TIMES: Record<MealType, [number, number]> = { breakfast: [8, 30], lunch: [13, 30], snack: [17, 0], dinner: [20, 30] };

export function loadDemoData(o: OnboardingState, today: string, now = new Date()) {
  const rand = random(1405);
  const pick = <T>(items: T[]) => items[Math.floor(rand() * items.length)];

  const med = (o.medication && "id" in o.medication && findMedication(o.medication.id)) || findMedication("velorita")!;
  const weekly = med.rhythm === "weekly";
  const time = o.schedule?.time ?? "21:00";

  // The last injection: on the person's weekday, before today (weekly), or yesterday (daily).
  let last = addDays(today, -1);
  if (weekly) {
    const day = o.schedule?.day ?? weekdayOf(addDays(today, -2));
    while (weekdayOf(last) !== day) last = addDays(last, -1);
  }
  const count = weekly ? 10 : 70;
  const step = weekly ? 7 : 1;
  const perStep = weekly ? 4 : 7;
  const target = Math.max(0, med.doses.indexOf(currentDoseMg(o) ?? med.doses[Math.min(2, med.doses.length - 1)]));

  const lastSite = o.schedule?.lastSite ? SITES.findIndex((s) => s.value === o.schedule!.lastSite) : 3;
  const injections: InjectionLog[] = Array.from({ length: count }, (_, k) => {
    const fromEnd = count - 1 - k;
    const [h, m] = time.split(":").map(Number);
    const minutes = Math.max(0, Math.min(23 * 60 + 55, h * 60 + m + Math.round(((rand() - 0.4) * 50) / 5) * 5));
    return {
      id: newId() + k,
      date: addDays(last, -fromEnd * step),
      time: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
      mg: med.doses[Math.max(0, target - Math.floor(fromEnd / perStep))],
      site: SITES[(((lastSite - fromEnd) % SITES.length) + SITES.length) % SITES.length].value,
    };
  });

  const first = injections[0].date;
  const span = daysBetween(first, today);
  const end = o.weight?.today ?? 84.4;
  const start =
    typeof o.weight?.start === "number" && o.weight.start > end + 2
      ? o.weight.start
      : Math.round((end + 7.4) * 10) / 10;

  // Weigh-ins every two or three days; the curve flattens as the weeks go by.
  const weights: WeightLog[] = [];
  for (let d = 0; d <= span; d += rand() < 0.55 ? 2 : 3) {
    const t = d / span;
    const noise = d === 0 ? 0 : (rand() - 0.5) * 0.7;
    const kg = start - (start - end) * (1 - Math.pow(1 - t, 1.6)) + noise;
    weights.push({ id: newId() + d, date: addDays(first, d), kg: Math.round(kg * 10) / 10 });
  }
  if (weights.at(-1)!.date !== today) weights.push({ id: newId(), date: today, kg: end });
  else weights.at(-1)!.kg = end;

  // A check-in on most days. Today is left open, so Today asks.
  const checkIns: CheckIn[] = [];
  for (let d = 1; d < span; d++) {
    // The last few days always have one, so this week shows faces.
    if (d < span - 3 && rand() < 0.14) continue;
    const date = addDays(first, d);
    const since = daysBetween(injections.findLast((i) => i.date <= date)!.date, date);
    const week = Math.floor(d / 7);
    // Right after a step up in dose, symptoms come back; otherwise they fade over the weeks.
    const sinceStep = weekly ? week % perStep : 0;
    const fade = weekly ? Math.max(0.35, 1 - week * 0.06) * (sinceStep === 0 ? 1.15 : 1) : Math.max(0.3, 1 - d / 60);
    const symptoms: CheckIn["symptoms"] = {};
    for (const [id, odds] of Object.entries(WEEKLY_ODDS) as [SymptomId, number[]][]) {
      const chance = (weekly ? odds[Math.min(since, 6)] : odds[2] * 0.7) * fade;
      if (rand() < chance) symptoms[id] = (rand() < 0.62 ? 1 : rand() < 0.85 ? 2 : 3) as 1 | 2 | 3;
    }
    const worst = Math.max(0, ...Object.values(symptoms));
    const mood = Math.min(5, Math.max(1, Math.round(4.3 - worst * 0.7 + (rand() - 0.5) * 1.2))) as Mood;
    const appetite: Appetite = since <= 2 && rand() < 0.7 ? "low" : rand() < 0.85 ? "normal" : "high";
    checkIns.push({ date, mood, symptoms, appetite, ...(rand() < 0.12 ? { note: pick(NOTES) } : {}) });
  }

  // Waist every two weeks, following the weight.
  const startWaist = 104;
  const measurements: Measurement[] = weights
    .filter((w) => daysBetween(first, w.date) % 14 < 3)
    .filter((w, i, all) => i === 0 || daysBetween(all[i - 1].date, w.date) >= 10)
    .map((w) => ({
      id: newId() + w.date,
      date: w.date,
      waistCm: Math.round((startWaist - (start - w.kg) * 0.85) * 2) / 2,
    }));

  // Two weeks of meals and water. Today only has the meals whose time has passed.
  const meals: MealLog[] = [];
  const water: WaterLog[] = [];
  const nowClock = clockNow(now);
  for (let d = 13; d >= 0; d--) {
    const date = addDays(today, -d);
    const order: MealType[] = rand() < 0.65 ? ["breakfast", "lunch", "snack", "dinner"] : ["breakfast", "lunch", "dinner"];
    for (const type of order) {
      if (d > 0 && rand() < 0.08) continue; // a meal forgotten now and then
      const [h, m] = MEAL_TIMES[type];
      const minutes = h * 60 + m + Math.round(((rand() - 0.5) * 60) / 5) * 5;
      const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
      if (d === 0 && time > nowClock) continue;
      const plan = pick(MEAL_PLANS[type]);
      meals.push({
        id: newId() + date + type,
        date,
        time,
        type,
        title: plan.title,
        items: plan.items.flatMap(([id, amount]) => {
          const food = findFood(id);
          return food ? [itemOf(food, amount)] : [];
        }),
        source: rand() < 0.8 ? "photo" : "manual",
      });
    }
    const glasses = d === 0 ? Math.min(8, Math.max(1, Math.round((now.getHours() - 7) / 2))) : 4 + Math.floor(rand() * 5);
    water.push({ date, glasses });
  }
  setRead(LESSON_PATH.slice(0, 3));

  setOnboarding({
    journey: "a-while",
    medication: { id: med.id },
    dose: { mg: injections.at(-1)!.mg! },
    schedule: {
      ...o.schedule,
      day: weekly ? weekdayOf(last) : null,
      time,
      firstDose: undefined,
      lastDose: last,
      startedAt: undefined,
    },
    weight: { today: end, start },
  });
  replaceAppData({ seeded: true, injections, weights, checkIns, measurements, meals, water });
}

/**
 * A whole sample person for a device with nothing saved yet (the same مریم as in the Figma
 * file): the answers the sample data doesn't make up, then the ten weeks of logs.
 */
export function loadSamplePerson(today: string) {
  setOnboarding({
    name: "مریم",
    about: { sex: "female", birthYear: 1365, height: 165 },
    goal: 75,
    worries: ["حالت تهوع"],
    reminders: { discreet: true, nightBefore: false, smsBackup: true, channel: "sms" },
  });
  loadDemoData(readOnboarding(), today);
}
