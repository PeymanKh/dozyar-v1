"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { InjectionLog, WeightLog } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { addDays, daysBetween, formatJalali } from "@/lib/jalali";
import { monotonePath } from "@/lib/chart";
import { formatKg, formatMg } from "@/lib/plan";

const HEIGHT = 208;
const PAD = { top: 18, right: 36, bottom: 30, left: 10 };

function niceStep(raw: number) {
  return [0.5, 1, 2, 2.5, 5, 10, 20].find((s) => s >= raw) ?? 20;
}

/**
 * Weight over a date range. Time runs left to right; the goal is a dashed line when it is
 * within reach of the view; injections sit as ticks along the bottom with the dose marked
 * where it changed, so weight reads next to the treatment. Touch and drag (or use the
 * arrow keys) to read any day; `onScrub` reports it so the header can show it.
 */
export function WeightChart({
  weights,
  injections,
  goal,
  from,
  to,
  onScrub,
}: {
  weights: WeightLog[];
  injections: InjectionLog[];
  goal: number | null;
  from: string;
  to: string;
  onScrub: (point: WeightLog | null) => void;
}) {
  const reduce = useReducedMotion();
  const gradient = useId();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = weights.filter((w) => w.date >= from && w.date <= to);
  const span = Math.max(1, daysBetween(from, to));
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = HEIGHT - PAD.top - PAD.bottom;

  let lo = Math.min(...points.map((p) => p.kg));
  let hi = Math.max(...points.map((p) => p.kg));
  const showGoal = goal !== null && goal >= lo - Math.max(hi - lo, 3);
  if (showGoal) lo = Math.min(lo, goal);
  const step = niceStep((hi - lo) / 3);
  lo = Math.floor((lo - step * 0.25) / step) * step;
  hi = Math.ceil((hi + step * 0.25) / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 10) / 10);

  const x = (date: string) => PAD.left + (daysBetween(from, date) / span) * innerW;
  const y = (kg: number) => PAD.top + (1 - (kg - lo) / (hi - lo || 1)) * innerH;
  const coords = points.map((p) => [x(p.date), y(p.kg)] as [number, number]);
  const line = monotonePath(coords);
  const area =
    coords.length > 1 ? `${line}L${coords.at(-1)![0]} ${PAD.top + innerH}L${coords[0][0]} ${PAD.top + innerH}Z` : "";

  const shots = injections.filter((i) => i.date >= from && i.date <= to);
  const doseMarks = injections.flatMap((i, k) =>
    i.date >= from && i.date <= to && i.mg !== null && (k === 0 || injections[k - 1].mg !== i.mg) ? [i] : [],
  );
  const labels = [0, 1 / 3, 2 / 3, 1].map((f) => addDays(from, Math.round(span * f)));

  function pick(clientX: number) {
    const el = box.current;
    if (!el || !coords.length) return;
    const px = clientX - el.getBoundingClientRect().left;
    let best = 0;
    coords.forEach(([cx], i) => {
      if (Math.abs(cx - px) < Math.abs(coords[best][0] - px)) best = i;
    });
    if (best !== active) {
      setActive(best);
      onScrub(points[best]);
    }
  }

  function release() {
    setActive(null);
    onScrub(null);
  }

  const first = points[0];
  const last = points.at(-1);
  const summary =
    first && last
      ? `از ${formatJalali(first.date, false)} تا ${formatJalali(last.date, false)}، وزن از ${formatKg(first.kg)} به ${formatKg(last.kg)} کیلوگرم رسید.`
      : "وزنی ثبت نشده.";

  const activePoint = active !== null ? coords[active] : null;

  return (
    <div
      ref={box}
      className="relative touch-pan-y select-none outline-none focus-visible:rounded-[16px] focus-visible:ring-2 focus-visible:ring-border-focus"
      style={{ height: HEIGHT }}
      tabIndex={0}
      role="img"
      aria-label={`نمودار وزن. ${summary}`}
      onKeyDown={(e) => {
        if (!points.length) return;
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const next = Math.min(
          points.length - 1,
          Math.max(0, (active ?? points.length - 1) + (e.key === "ArrowRight" ? 1 : -1)),
        );
        setActive(next);
        onScrub(points[next]);
      }}
      onBlur={release}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        pick(e.clientX);
      }}
      onPointerMove={(e) => (e.buttons || e.pointerType === "mouse" ? pick(e.clientX) : undefined)}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={(e) => (e.pointerType === "mouse" ? release() : undefined)}
    >
      {width > 0 && coords.length ? (
        // Laid out left to right; text anchors are read in that direction.
        <svg
          width={width}
          height={HEIGHT}
          className="absolute inset-0 overflow-visible"
          style={{ direction: "ltr" }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-violet-400)" stopOpacity="0.26" />
              <stop offset="1" stopColor="var(--color-violet-400)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid and weight labels on the right */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--color-violet-100)"
                strokeDasharray="2 4"
              />
              <text x={width - 2} y={y(t) + 4} textAnchor="end" className="fill-text-tertiary text-[11px]">
                {toFaDigits(String(t)).replace(".", "٫")}
              </text>
            </g>
          ))}

          {/* Goal */}
          {showGoal ? (
            <g>
              <line
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={y(goal)}
                y2={y(goal)}
                stroke="var(--color-violet-500)"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                opacity={0.7}
              />
              <rect
                x={PAD.left}
                y={y(goal) - 20}
                width={54}
                height={17}
                rx={8.5}
                fill="var(--color-surface-brand-soft)"
              />
              <text
                x={PAD.left + 27}
                y={y(goal) - 8}
                textAnchor="middle"
                direction="rtl"
                className="fill-text-brand text-[10px] font-bold"
              >
                هدف {formatKg(goal)}
              </text>
            </g>
          ) : null}

          {/* Area and line */}
          <motion.path
            key={`area-${from}-${points.length}`}
            d={area}
            fill={`url(#${gradient})`}
            initial={{ opacity: reduce ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: reduce ? 0 : 0.3 }}
          />
          <motion.path
            key={`line-${from}-${points.length}`}
            d={line}
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ type: "spring", bounce: 0, duration: 1.1 }}
          />

          {/* Injections along the bottom; the dose where it changed */}
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
          {doseMarks.map((s) => (
            <text
              key={`dose-${s.id}`}
              x={Math.min(PAD.left + innerW, Math.max(PAD.left + 12, x(s.date)))}
              y={PAD.top + innerH - 4}
              textAnchor="middle"
              className="fill-text-brand text-[9.5px] font-bold"
            >
              {formatMg(s.mg!)}
            </text>
          ))}

          {/* Dates. Persian text is laid out right to left, so the anchors flip. */}
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

          {/* Last point, or the one being read */}
          {activePoint ? (
            <g>
              <line
                x1={activePoint[0]}
                x2={activePoint[0]}
                y1={PAD.top - 6}
                y2={PAD.top + innerH}
                stroke="var(--color-violet-300)"
                strokeWidth={1.5}
              />
              <circle cx={activePoint[0]} cy={activePoint[1]} r={7} fill="var(--color-brand)" opacity={0.18} />
              <circle
                cx={activePoint[0]}
                cy={activePoint[1]}
                r={4.5}
                fill="var(--color-brand)"
                stroke="white"
                strokeWidth={2}
              />
            </g>
          ) : (
            <circle
              cx={coords.at(-1)![0]}
              cy={coords.at(-1)![1]}
              r={4.5}
              fill="var(--color-brand)"
              stroke="white"
              strokeWidth={2}
            />
          )}
        </svg>
      ) : null}
      <p className="sr-only">{summary}</p>
    </div>
  );
}
