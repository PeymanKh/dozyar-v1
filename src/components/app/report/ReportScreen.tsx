"use client";

import { useState } from "react";
import { SITE_LABEL } from "@/components/app/BodyMap";
import { AppHeader } from "@/components/app/AppHeader";
import { Screen } from "@/components/app/Screen";
import { Button } from "@/components/ui/Button";
import { Printer, Share } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/Segmented";
import { useAppData, type AppData } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { addDays, daysBetween, formatJalali, isoOf, jalaliOf } from "@/lib/jalali";
import { findMedication, RHYTHM_LABEL } from "@/lib/medications";
import { formatGrams, periodNutrition, targetsFor } from "@/lib/nutrition";
import { useOnboarding, type OnboardingState } from "@/lib/onboarding-store";
import { formatClock, formatKg, formatMg, formatTime, medicationName, rhythmOf } from "@/lib/plan";
import { averageMood, daysSinceInjection, symptomCounts, weightOn } from "@/lib/stats";
import { MOOD_LABEL, SEVERITY_LABEL, type Mood } from "@/lib/symptoms";
import { adherence, currentDoseMg, doseSteps, treatmentStart } from "@/lib/treatment";
import { toast } from "@/lib/ui-store";
import { useNow } from "@/lib/use-now";

type Period = "4w" | "12w" | "all";
const PERIODS: { value: Period; label: string }[] = [
  { value: "4w", label: "۴ هفته" },
  { value: "12w", label: "۱۲ هفته" },
  { value: "all", label: "از شروع" },
];

const fa1 = (n: number) => toFaDigits(String(Math.round(n * 10) / 10)).replace(".", "٫");

/**
 * A one-page summary for the doctor, laid out like paper: who, which treatment and dose
 * steps, injections and how regular they were, weight, symptoms and when they come, food
 * (protein, fiber, water on the days logged), and the person's own notes. Saved as PDF through the browser's print, or shared as text.
 * Only facts the person logged; no interpretation, no BMI, and a closing disclaimer.
 */
export function ReportScreen() {
  const now = useNow();
  const o = useOnboarding();
  const data = useAppData();
  const [period, setPeriod] = useState<Period>("12w");
  if (!now) return null;

  const today = isoOf(now);
  const earliest = [data.injections[0]?.date, data.weights[0]?.date, data.checkIns[0]?.date, today]
    .filter(Boolean)
    .sort()[0]!;
  const wanted = period === "4w" ? addDays(today, -27) : period === "12w" ? addDays(today, -83) : earliest;
  const from = wanted < earliest ? earliest : wanted;

  async function share() {
    const text = reportText(o, data, from, today);
    try {
      if (navigator.share) await navigator.share({ title: "گزارش درمان", text });
      else {
        await navigator.clipboard.writeText(text);
        toast("متن گزارش کپی شد");
      }
    } catch {
      // the person closed the share sheet
    }
  }

  return (
    <Screen pushed>
      <div className="print:hidden">
        <AppHeader title="گزارش برای پزشک" back />
      </div>

      <div className="flex flex-col gap-4 px-4">
        <div className="print:hidden">
          <Segmented label="بازه‌ی گزارش" value={period} onChange={setPeriod} options={PERIODS} />
        </div>

        <Report o={o} data={data} from={from} today={today} />

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 bg-linear-to-t from-bg-canvas from-70% to-bg-canvas/0 px-4 pt-6 pb-[max(env(safe-area-inset-bottom),16px)] print:hidden">
          <Button onClick={() => window.print()}>
            <Printer size={20} />
            ذخیره به‌صورت PDF
          </Button>
          <Button variant="secondary" onClick={share}>
            <Share size={20} />
            اشتراک‌گذاری متن گزارش
          </Button>
        </div>
      </div>
    </Screen>
  );
}

function Report({ o, data, from, today }: { o: OnboardingState; data: AppData; from: string; today: string }) {
  const med = o.medication && "id" in o.medication ? findMedication(o.medication.id) : undefined;
  const rhythm = rhythmOf(o.medication);
  const mg = currentDoseMg(o);
  const start = treatmentStart(o, data.injections);
  const shots = data.injections.filter((i) => i.date >= from && i.date <= today);
  const steps = doseSteps(data.injections);
  const regular = adherence(data.injections, rhythm, from, today);
  const sites = new Set(shots.flatMap((s) => (s.site ? [s.site] : []))).size;
  const weights = data.weights.filter((w) => w.date >= from && w.date <= today);
  const firstW = weightOn(data.weights, from) ?? weights[0]?.kg;
  const lastW = weights.at(-1)?.kg ?? null;
  const overallStart = data.weights[0]?.kg;
  const waist = data.measurements.filter((m) => m.date >= from && m.date <= today);
  const symptoms = symptomCounts(data.checkIns, from, today);
  const checkInDays = data.checkIns.filter((c) => c.date >= from && c.date <= today);
  const mood = averageMood(data.checkIns, from, today);
  const notes = checkInDays
    .filter((c) => c.note)
    .slice(-4)
    .reverse();
  const age = o.about ? jalaliOf(today).jy - o.about.birthYear : null;
  const food = periodNutrition(data.meals, data.water, from, today);
  const targets = targetsFor(o, data.weights);

  // For each symptom, the day after the injection it was most often logged.
  const typicalDay = (id: string) => {
    const counts = new Map<number, number>();
    for (const c of checkInDays) {
      if (!c.symptoms[id as keyof typeof c.symptoms]) continue;
      const d = daysSinceInjection(data.injections, c.date);
      if (d !== null && d < 7) counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return best ? (best[0] === 0 ? "روز تزریق" : `روز ${toFaDigits(best[0])}`) : "—";
  };

  return (
    <article className="print-area rounded-[20px] border border-violet-100 bg-white p-6 text-[13px] leading-relaxed text-text-primary shadow-[0_18px_40px_-24px_rgb(30_27_51/0.35)] print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="flex items-start justify-between gap-4 border-b-2 border-brand pb-4">
        <div>
          <p className="text-caption text-text-brand">دوزیار</p>
          <h2 className="font-display text-[20px] font-bold">گزارش درمان</h2>
          <p className="text-caption text-text-secondary">
            {formatJalali(from, false)} تا {formatJalali(today, false)} {toFaDigits(jalaliOf(today).jy)} (
            {toFaDigits(daysBetween(from, today) + 1)} روز)
          </p>
        </div>
        <div className="text-end text-caption text-text-secondary">
          <p className="text-body-strong text-text-primary">{o.name?.trim() || "—"}</p>
          <p>
            {[
              o.about ? (o.about.sex === "female" ? "زن" : "مرد") : null,
              age ? `${toFaDigits(age)} ساله` : null,
              o.about ? `قد ${toFaDigits(o.about.height)}` : null,
            ]
              .filter(Boolean)
              .join("، ")}
          </p>
        </div>
      </header>

      <Section title="درمان">
        <Facts
          rows={[
            ["دارو", med ? `${med.fa} (${med.en})، ${med.generic}` : medicationName(o.medication) || "مشخص نشده"],
            ["برنامه", `${RHYTHM_LABEL[rhythm]}${o.schedule ? `، ساعت ${formatTime(o.schedule.time)}` : ""}`],
            ["دوز فعلی", mg !== null ? `${formatMg(mg)} میلی‌گرم` : "ثبت نشده"],
            ["شروع درمان", start ? formatJalali(start, false) + ` ${toFaDigits(jalaliOf(start).jy)}` : "—"],
          ]}
        />
        {steps.length ? (
          <Table
            head={["دوز", "از تاریخ", "تعداد تزریق"]}
            rows={steps.map((s) => [
              s.mg !== null ? `${formatMg(s.mg)} میلی‌گرم` : "نامشخص",
              formatJalali(s.from, false),
              toFaDigits(s.count),
            ])}
          />
        ) : null}
      </Section>

      <Section title="تزریق‌ها در این بازه">
        <Facts
          rows={[
            ["ثبت‌شده", `${toFaDigits(regular.logged)} از ${toFaDigits(regular.expected)} نوبت`],
            ["جای تزریق", sites ? `${toFaDigits(sites)} جای مختلف، به نوبت` : "ثبت نشده"],
          ]}
        />
        {shots.length ? (
          <Table
            head={["تاریخ", "ساعت", "دوز", "جا"]}
            rows={[...shots]
              .reverse()
              .slice(0, 12)
              .map((s) => [
                formatJalali(s.date, false),
                formatClock(s.time),
                s.mg !== null ? `${formatMg(s.mg)} میلی‌گرم` : "—",
                s.site ? SITE_LABEL[s.site] : "—",
              ])}
          />
        ) : null}
      </Section>

      <Section title="وزن">
        <Facts
          rows={[
            ["اول بازه", firstW !== undefined ? `${formatKg(firstW)} کیلوگرم` : "—"],
            ["آخرین", lastW !== null ? `${formatKg(lastW)} کیلوگرم` : "—"],
            [
              "تغییر در بازه",
              firstW !== undefined && lastW !== null
                ? `${formatKg(Math.abs(lastW - firstW))} کیلوگرم ${lastW <= firstW ? "کاهش" : "افزایش"} (${fa1((Math.abs(lastW - firstW) / firstW) * 100)}٪)`
                : "—",
            ],
            [
              "از شروع",
              overallStart !== undefined && lastW !== null
                ? `${formatKg(Math.abs(lastW - overallStart))} کیلوگرم ${lastW <= overallStart ? "کاهش" : "افزایش"} (${fa1((Math.abs(lastW - overallStart) / overallStart) * 100)}٪)`
                : "—",
            ],
            ...(waist.length > 1
              ? ([["دور کمر", `${formatKg(waist[0].waistCm)} ← ${formatKg(waist.at(-1)!.waistCm)} سانتی‌متر`]] as [
                  string,
                  string,
                ][])
              : []),
          ]}
        />
        {weights.length > 1 ? (
          <MiniChart values={weights.map((w) => w.kg)} from={weights[0].date} to={weights.at(-1)!.date} />
        ) : null}
      </Section>

      <Section title="علائم و حال">
        <Facts
          rows={[
            ["روزهای ثبت‌شده", `${toFaDigits(checkInDays.length)} از ${toFaDigits(daysBetween(from, today) + 1)} روز`],
            ["میانگین حال", mood !== null ? `${MOOD_LABEL[Math.round(mood) as Mood]} (${fa1(mood)} از ۵)` : "—"],
          ]}
        />
        {symptoms.length ? (
          <Table
            head={
              rhythm === "weekly" ? ["علامت", "روزها", "بیشترین شدت", "بیشتر در"] : ["علامت", "روزها", "بیشترین شدت"]
            }
            rows={symptoms.map((s) => [
              s.label,
              toFaDigits(s.days),
              SEVERITY_LABEL[s.worst],
              ...(rhythm === "weekly" ? [typicalDay(s.id)] : []),
            ])}
          />
        ) : (
          <p className="mt-2 text-text-secondary">علامتی در این بازه ثبت نشده.</p>
        )}
        {rhythm === "weekly" && symptoms.length ? (
          <p className="mt-1.5 text-caption-small text-text-tertiary">
            «بیشتر در»: چندمین روز بعد از تزریق که علامت بیشتر ثبت شده.
          </p>
        ) : null}
      </Section>

      {food.daysLogged || food.waterDays ? (
        <Section title="تغذیه">
          <Facts
            rows={[
              ["روزهای ثبت غذا", `${toFaDigits(food.daysLogged)} از ${toFaDigits(daysBetween(from, today) + 1)} روز`],
              [
                "پروتئین",
                food.daysLogged
                  ? `میانگین ${formatGrams(food.protein)} گرم در روز (هدف ${toFaDigits(targets.protein)} گرم)`
                  : "—",
              ],
              ["فیبر", food.daysLogged ? `میانگین ${formatGrams(food.fiber)} گرم در روز` : "—"],
              ["آب", food.waterDays ? `میانگین ${fa1(food.water)} لیوان در روز` : "—"],
            ]}
          />
          <p className="mt-1.5 text-caption-small text-text-tertiary">
            میانگین‌ها فقط از روزهایی که ثبت شده‌اند؛ مقدارها از عکس غذا تخمین زده شده‌اند.
          </p>
        </Section>
      ) : null}

      {notes.length ? (
        <Section title="یادداشت‌های بیمار">
          <ul className="flex flex-col gap-1.5">
            {notes.map((c) => (
              <li key={c.date}>
                <span className="text-text-secondary">{formatJalali(c.date, false)}: </span>
                {c.note}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <footer className="mt-6 border-t border-violet-100 pt-3 text-caption-small text-text-tertiary">
        این گزارش از داده‌هایی ساخته شده که بیمار خودش در دوزیار ثبت کرده و جای ارزیابی پزشکی رو نمی‌گیره. ساخته‌شده در{" "}
        {formatJalali(today)} {toFaDigits(jalaliOf(today).jy)}.
      </footer>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h3 className="mb-2 font-display text-[15px] font-bold text-text-brand">{title}</h3>
      {children}
    </section>
  );
}

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-text-secondary">{k}</dt>
          <dd className="font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="mt-3 w-full border-collapse text-start text-[12px]">
      <thead>
        <tr className="border-b border-violet-200 text-text-secondary">
          {head.map((h) => (
            <th key={h} className="py-1.5 text-start font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-violet-100 last:border-0">
            {r.map((c, j) => (
              <td key={j} className="py-1.5">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A small static weight line for paper (no interaction, scales with the page). */
function MiniChart({ values, from, to }: { values: number[]; from: string; to: string }) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map(
    (v, i) => `${((i / (values.length - 1)) * 600).toFixed(1)},${(8 + (1 - (v - lo) / span) * 104).toFixed(1)}`,
  );
  return (
    <figure className="mt-3">
      <div className="flex gap-2" dir="ltr">
        <svg viewBox="0 0 600 120" preserveAspectRatio="none" className="h-24 flex-1" aria-hidden="true">
          <polygon points={`0,120 ${pts.join(" ")} 600,120`} fill="var(--color-violet-100)" />
          <polyline
            points={pts.join(" ")}
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex flex-col justify-between text-caption-small text-text-tertiary">
          <span>{formatKg(hi)}</span>
          <span>{formatKg(lo)}</span>
        </div>
      </div>
      <figcaption dir="ltr" className="mt-1 flex justify-between text-caption-small text-text-tertiary">
        <span dir="rtl">{formatJalali(from, false)}</span>
        <span dir="rtl">{formatJalali(to, false)}</span>
      </figcaption>
    </figure>
  );
}

/** The same facts as plain text, for messaging apps. */
function reportText(o: OnboardingState, data: AppData, from: string, today: string): string {
  const rhythm = rhythmOf(o.medication);
  const mg = currentDoseMg(o);
  const shots = data.injections.filter((i) => i.date >= from && i.date <= today);
  const regular = adherence(data.injections, rhythm, from, today);
  const firstW = weightOn(data.weights, from) ?? data.weights.find((w) => w.date >= from)?.kg;
  const lastW = data.weights.at(-1)?.kg;
  const symptoms = symptomCounts(data.checkIns, from, today);
  const food = periodNutrition(data.meals, data.water, from, today);
  const lines = [
    `گزارش درمان دوزیار: ${o.name?.trim() ?? ""}`,
    `${formatJalali(from, false)} تا ${formatJalali(today, false)}`,
    "",
    `دارو: ${medicationName(o.medication) || "مشخص نشده"} (${RHYTHM_LABEL[rhythm]})`,
    `دوز فعلی: ${mg !== null ? `${formatMg(mg)} میلی‌گرم` : "ثبت نشده"}`,
    `تزریق‌ها: ${toFaDigits(regular.logged)} از ${toFaDigits(regular.expected)} نوبت (${toFaDigits(shots.length)} ثبت)`,
    firstW !== undefined && lastW !== undefined ? `وزن: ${formatKg(firstW)} ← ${formatKg(lastW)} کیلوگرم` : "",
    symptoms.length
      ? `علائم: ${symptoms.map((s) => `${s.label} ${toFaDigits(s.days)} روز (حداکثر ${SEVERITY_LABEL[s.worst]})`).join("، ")}`
      : "علائم: موردی ثبت نشده",
    food.daysLogged
      ? `تغذیه: میانگین پروتئین ${formatGrams(food.protein)} گرم و فیبر ${formatGrams(food.fiber)} گرم در روز (${toFaDigits(food.daysLogged)} روز ثبت)`
      : "",
    "",
    "داده‌ها را بیمار خودش ثبت کرده است.",
  ];
  return lines.filter((l, i) => l !== "" || lines[i - 1] !== "").join("\n");
}
