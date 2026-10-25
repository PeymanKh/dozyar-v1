"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Sparkles } from "@/components/ui/icons";
import { MoodFace } from "@/components/ui/MoodFace";
import { useAppData, type CheckIn } from "@/lib/app-store";
import { monotonePath } from "@/lib/chart";
import { toFaDigits } from "@/lib/digits";
import { addDays, daysBetween, formatJalali } from "@/lib/jalali";
import type { PeriodSummary } from "@/lib/stats";
import { APPETITE_LABEL, MOOD_LABEL, type Mood } from "@/lib/symptoms";

const fa1 = (n: number) => toFaDigits(String(Math.round(n * 10) / 10)).replace(".", "٫");

/** «هفته‌ی قبلش» / «ماه قبلش» / «سه ماه قبلش» */
export function previousPeriod(days: number) {
  return days <= 7 ? "هفته‌ی قبلش" : days <= 31 ? "ماه قبلش" : "سه ماه قبلش";
}

/**
 * What the period says, in a few plain sentences: how often they logged, a calm streak,
 * the most common symptom against the period before, mood against the period before, and
 * appetite. Facts and directions only; no advice.
 */
export function InsightSummary({ summary }: { summary: PeriodSummary }) {
  const { days, logged, mood, prevMood, top, prevTopDays, calmStreak, appetite } = summary;
  const before = previousPeriod(days);
  const lines: string[] = [`از ${toFaDigits(days)} روز اخیر، ${toFaDigits(logged)} روز حالت رو ثبت کردی.`];

  if (calmStreak >= 2) lines.push(`${toFaDigits(calmStreak)} روزه که پشت سر هم علامتی نداشتی.`);

  if (top) {
    const diff = top.days - prevTopDays;
    const change =
      prevTopDays === 0 || diff === 0
        ? ""
        : `، ${toFaDigits(Math.abs(diff))} روز ${diff < 0 ? "کمتر" : "بیشتر"} از ${before}`;
    lines.push(`بیشترین علامت ${top.label} بوده: ${toFaDigits(top.days)} روز${change}.`);
  } else if (logged) {
    lines.push("توی این مدت علامتی ثبت نکردی.");
  }

  if (mood !== null && prevMood !== null) {
    const d = mood - prevMood;
    lines.push(
      d >= 0.3
        ? `حال کلیت بهتر از ${before} بوده.`
        : d <= -0.3
          ? `حال کلیت کمی پایین‌تر از ${before} بوده.`
          : `حال کلیت تقریباً مثل ${before} بوده.`,
    );
  }

  if (appetite) lines.push(`اشتهات بیشتر روزها ${APPETITE_LABEL[appetite]} بوده.`);

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-brand-subtle text-text-brand">
          <Sparkles size={18} />
        </span>
        <h3 className="text-title-section text-text-primary">خلاصه</h3>
      </div>
      <ul className="flex flex-col gap-2.5">
        {lines.map((l) => (
          <li key={l} className="flex items-start gap-2.5 text-body-small text-pretty text-text-primary">
            <span aria-hidden="true" className="mt-[9px] size-1.5 shrink-0 rounded-full bg-brand" />
            {l}
          </li>
        ))}
      </ul>
    </Card>
  );
}

const HEIGHT = 176;
const PAD = { top: 14, right: 34, bottom: 28, left: 8 };
/** Logged days further apart than this are not joined by the line. */
const GAP = 3;

/**
 * Mood over the period: one light dot per logged day (faces on the side: great at the top,
 * very bad at the bottom), and the trend as a smooth line (a rolling average, since single
 * days jump around), the period's average dashed, injections as ticks along the bottom.
 * Touch and drag to read a day. Time runs left to right, like the other charts.
 */
export function MoodTrend({ from, to, summary }: { from: string; to: string; summary: PeriodSummary }) {
  const reduce = useReducedMotion();
  const { checkIns, injections } = useAppData();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<CheckIn | null>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = checkIns.filter((c) => c.date >= from && c.date <= to);
  const shots = injections.filter((i) => i.date >= from && i.date <= to);
  const span = Math.max(1, daysBetween(from, to));
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (date: string) => PAD.left + (daysBetween(from, date) / span) * innerW;
  const y = (mood: number) => PAD.top + ((5 - mood) / 4) * innerH;

  // Runs of logged days close enough together to draw as one line.
  const runs: CheckIn[][] = [];
  for (const p of points) {
    const run = runs.at(-1);
    if (run && daysBetween(run.at(-1)!.date, p.date) <= GAP) run.push(p);
    else runs.push([p]);
  }
  const dot = span > 40 ? 2.4 : 3.6;
  // Each day's trend: the average of the days logged around it.
  const reach = span <= 7 ? 1 : span <= 31 ? 3 : 7;
  const trend = (date: string) => {
    const near = checkIns.filter((c) => Math.abs(daysBetween(date, c.date)) <= reach);
    return near.reduce((a, c) => a + c.mood, 0) / near.length;
  };
  const labels = [0, 0.5, 1].map((f) => addDays(from, Math.round(span * f)));

  function pick(clientX: number) {
    const el = box.current;
    if (!el || !points.length) return;
    const px = clientX - el.getBoundingClientRect().left;
    const nearest = points.reduce((a, b) => (Math.abs(x(b.date) - px) < Math.abs(x(a.date) - px) ? b : a));
    setActive(nearest);
  }

  const { mood, prevMood } = summary;
  const shown = active?.mood ?? (mood !== null ? Math.round(mood) : null);
  const compare =
    mood === null || prevMood === null
      ? null
      : mood - prevMood >= 0.3
        ? `بهتر از ${previousPeriod(summary.days)}`
        : mood - prevMood <= -0.3
          ? `کمی پایین‌تر از ${previousPeriod(summary.days)}`
          : `مثل ${previousPeriod(summary.days)}`;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3.5" aria-live="polite">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-brand-subtle text-text-brand">
          {shown ? <MoodFace mood={shown as Mood} size={28} /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-caption text-text-secondary">{active ? formatJalali(active.date) : "میانگین حال"}</p>
          <p className="text-body-strong text-text-primary">
            {active
              ? MOOD_LABEL[active.mood]
              : mood !== null
                ? `${MOOD_LABEL[Math.round(mood) as Mood]}، ${fa1(mood)} از ۵`
                : "—"}
          </p>
          {!active && compare ? <p className="text-caption text-text-brand">{compare}</p> : null}
        </div>
      </div>

      <div
        ref={box}
        className="relative mt-4 touch-pan-y select-none"
        style={{ height: HEIGHT }}
        role="img"
        aria-label={`نمودار حال از ${formatJalali(from, false)} تا ${formatJalali(to, false)}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e.clientX);
        }}
        onPointerMove={(e) => (e.buttons || e.pointerType === "mouse" ? pick(e.clientX) : undefined)}
        onPointerUp={() => setActive(null)}
        onPointerCancel={() => setActive(null)}
        onPointerLeave={(e) => (e.pointerType === "mouse" ? setActive(null) : undefined)}
      >
        {/* Faces down the side: great at the top, very bad at the bottom */}
        {([5, 3, 1] as Mood[]).map((m) => (
          <span
            key={m}
            aria-hidden="true"
            className="absolute right-0 grid size-5 -translate-y-1/2 place-items-center text-violet-300"
            style={{ top: y(m) }}
          >
            <MoodFace mood={m} size={18} />
          </span>
        ))}

        {width > 0 ? (
          <svg
            width={width}
            height={HEIGHT}
            className="absolute inset-0 overflow-visible"
            style={{ direction: "ltr" }}
            aria-hidden="true"
          >
            {[1, 2, 3, 4, 5].map((m) => (
              <line
                key={m}
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={y(m)}
                y2={y(m)}
                stroke="var(--color-violet-100)"
                strokeDasharray="2 4"
              />
            ))}
            {mood !== null ? (
              <line
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={y(mood)}
                y2={y(mood)}
                stroke="var(--color-violet-400)"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                opacity={0.7}
              />
            ) : null}

            {/* Days first, the trend over them */}
            {points.map((p) => (
              <circle
                key={p.date}
                cx={x(p.date)}
                cy={y(p.mood)}
                r={active?.date === p.date ? dot + 2.5 : dot}
                fill={active?.date === p.date ? "var(--color-brand)" : "var(--color-violet-300)"}
                stroke="white"
                strokeWidth={1.5}
              />
            ))}
            {runs.map((run, k) =>
              run.length > 1 ? (
                <motion.path
                  key={`${from}-${k}`}
                  d={monotonePath(run.map((p) => [x(p.date), y(trend(p.date))]))}
                  fill="none"
                  stroke="var(--color-brand)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  initial={{ pathLength: reduce ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ type: "spring", bounce: 0, duration: 1 }}
                />
              ) : null,
            )}
            {active ? (
              <g>
                <line
                  x1={x(active.date)}
                  x2={x(active.date)}
                  y1={PAD.top - 6}
                  y2={PAD.top + innerH}
                  stroke="var(--color-violet-300)"
                  strokeWidth={1.5}
                />
                <circle
                  cx={x(active.date)}
                  cy={y(active.mood)}
                  r={dot + 2.5}
                  fill="var(--color-brand)"
                  stroke="white"
                  strokeWidth={2}
                />
              </g>
            ) : null}

            {shots.map((s) => (
              <rect
                key={s.id}
                x={x(s.date) - 1.5}
                y={PAD.top + innerH + 4}
                width={3}
                height={7}
                rx={1.5}
                fill="var(--color-violet-300)"
              />
            ))}
            {labels.map((d, i) => (
              <text
                key={`${d}-${i}`}
                x={x(d)}
                y={HEIGHT - 2}
                direction="rtl"
                textAnchor={i === 0 ? "end" : i === labels.length - 1 ? "start" : "middle"}
                className="fill-text-tertiary text-[11px]"
              >
                {formatJalali(d, false)}
              </text>
            ))}
          </svg>
        ) : null}
      </div>
      <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 text-caption-small text-text-secondary">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-violet-300" />
          هر روز
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-[3px] w-3.5 rounded-full bg-brand" />
          روند
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-3.5 border-t-[1.5px] border-dashed border-violet-400" />
          میانگین
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-[3px] rounded-full bg-violet-300" />
          تزریق
        </li>
      </ul>
    </Card>
  );
}
