"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { GhostChart } from "@/components/app/GhostChart";
import { Card } from "@/components/ui/Card";
import { useAppData } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { formatJalali, WEEKDAY_SHORT } from "@/lib/jalali";
import { dayNutrients, formatGrams, mealsOn, targetsFor } from "@/lib/nutrition";
import { useOnboarding } from "@/lib/onboarding-store";
import { weekOf } from "@/lib/stats";

const H = 120;

/**
 * Protein each day this week (Saturday to Friday) against the target line. Days run left to
 * right like the app's other charts; today is the solid bar. Tap a day to read it.
 */
export function WeekProtein({ today }: { today: string }) {
  const reduce = useReducedMotion();
  const o = useOnboarding();
  const { meals, weights } = useAppData();
  const target = targetsFor(o, weights).protein;
  const week = weekOf(today);
  const days = week.map((d) => ({ date: d, logged: mealsOn(meals, d).length > 0, protein: dayNutrients(meals, d).protein }));
  const [picked, setPicked] = useState(today);
  const logged = days.filter((d) => d.logged && d.date <= today);
  const avg = logged.length ? logged.reduce((s, d) => s + d.protein, 0) / logged.length : 0;
  const top = Math.max(target * 1.2, ...days.map((d) => d.protein));
  const shown = days.find((d) => d.date === picked)!;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div aria-live="polite">
          <p className="text-caption text-text-secondary">{picked === today ? "امروز" : formatJalali(picked)}</p>
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-[26px] leading-tight font-bold text-text-primary">
              {shown.logged ? formatGrams(shown.protein) : "—"}
            </span>
            <span className="text-label text-text-secondary">گرم پروتئین</span>
          </p>
        </div>
        <p className="pt-1 text-end text-caption text-text-secondary">
          هدف {toFaDigits(target)} گرم
          {logged.length ? <span className="block">میانگین {formatGrams(avg)} گرم</span> : null}
        </p>
      </div>

      {logged.length ? (
        <div className="mt-4">
          <div dir="ltr" className="relative flex items-end gap-2" style={{ height: H }}>
            {/* Target line */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 border-t-[1.5px] border-dashed border-violet-400/70"
              style={{ bottom: (target / top) * H }}
            />
            {days.map((d, i) => {
              const future = d.date > today;
              const h = d.logged ? Math.max(6, (d.protein / top) * H) : 6;
              const active = d.date === picked;
              return (
                <button
                  key={d.date}
                  type="button"
                  disabled={future}
                  onClick={() => setPicked(d.date)}
                  aria-label={`${formatJalali(d.date)}: ${d.logged ? `${formatGrams(d.protein)} گرم پروتئین` : "ثبت نشده"}`}
                  aria-pressed={active}
                  className="relative flex h-full flex-1 items-end justify-center"
                >
                  <motion.span
                    className={`block w-full max-w-7 rounded-[8px] ${
                      !d.logged
                        ? "bg-violet-50"
                        : d.date === today
                          ? "bg-brand"
                          : d.protein >= target
                            ? "bg-violet-400"
                            : "bg-violet-300"
                    } ${active ? "ring-2 ring-violet-200 ring-offset-2 ring-offset-surface" : ""}`}
                    initial={{ height: reduce ? h : 6 }}
                    animate={{ height: h }}
                    transition={{ type: "spring", bounce: 0, duration: 0.7, delay: reduce ? 0 : i * 0.04 }}
                  />
                </button>
              );
            })}
          </div>
          <div dir="ltr" className="mt-2 flex gap-2 text-center text-caption-small">
            {week.map((d, i) => (
              <span key={d} className={`flex-1 ${d === today ? "font-bold text-text-brand" : "text-text-tertiary"}`}>
                {WEEKDAY_SHORT[i]}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <GhostChart kind="bars" height={140}>
            <p className="text-body-strong text-text-primary">روند پروتئین هفته‌ات اینجا میاد</p>
            <p className="-mt-2 text-caption text-balance text-text-secondary">از اولین وعده‌ای که ثبت کنی، هر روز یه ستون اضافه می‌شه.</p>
          </GhostChart>
        </div>
      )}
    </Card>
  );
}
