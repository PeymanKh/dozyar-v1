"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toFaDigits } from "@/lib/digits";

/**
 * Horizontal ruler for picking a number, like a kitchen scale's tape: native scroll with
 * momentum, the value under the center line updates live, and it settles exactly on a step.
 * A light tick (vibration, where the phone allows it) marks each whole unit.
 * Laid out left to right like a real ruler, even in the RTL page.
 */
export function Ruler({
  min,
  max,
  step = 0.1,
  value,
  onChange,
  label,
  compact = false,
  disabled = false,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label: string;
  /** Shorter ruler for a secondary value. */
  compact?: boolean;
  disabled?: boolean;
}) {
  const PX = 9; // pixels per step
  const ref = useRef<HTMLDivElement>(null);
  const [half, setHalf] = useState(0);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWhole = useRef<number | null>(null);
  const programmatic = useRef(false);
  const latest = useRef({ value, onChange });
  useLayoutEffect(() => {
    latest.current = { value, onChange };
  });

  const steps = Math.round((max - min) / step);
  const stepsPerUnit = Math.round(1 / step);
  // A tall tick and a number at whole units, or every 2, 5 or 10 when units are close together.
  const majorEvery = [1, 2, 5, 10].find((n) => n * stepsPerUnit * PX >= 60) ?? 10;
  const round = (v: number) => Math.round(v / step) * step;
  const toLeft = (v: number) => Math.round((v - min) / step) * PX;

  // Measure, then place the ruler on the value. Also runs when a hidden page is shown again.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setHalf(el.clientWidth / 2);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !half) return;
    programmatic.current = true;
    el.scrollLeft = toLeft(latest.current.value);
    lastWhole.current = Math.floor(latest.current.value);
    requestAnimationFrame(() => (programmatic.current = false));
    // toLeft only depends on min/step, which are fixed per ruler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [half]);

  useEffect(
    () => () => {
      if (settle.current) clearTimeout(settle.current);
    },
    [],
  );

  function onScroll() {
    const el = ref.current;
    if (!el || programmatic.current) return;
    const raw = min + (el.scrollLeft / PX) * step;
    const v = Math.min(max, Math.max(min, Number(round(raw).toFixed(2))));
    const whole = Math.floor(v);
    if (lastWhole.current !== null && whole !== lastWhole.current && "vibrate" in navigator) navigator.vibrate?.(4);
    lastWhole.current = whole;
    if (v !== latest.current.value) latest.current.onChange(v);
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => el.scrollTo({ left: toLeft(v), behavior: "smooth" }), 140);
  }

  function nudge(direction: 1 | -1) {
    const v = Math.min(max, Math.max(min, Number(round(latest.current.value + direction * step).toFixed(2))));
    latest.current.onChange(v);
    ref.current?.scrollTo({ left: toLeft(v), behavior: "smooth" });
  }

  const height = compact ? 56 : 76;
  const labels = [];
  for (let u = Math.ceil(min / majorEvery) * majorEvery; u <= max; u += majorEvery) labels.push(u);

  return (
    <div className={`relative ${disabled ? "pointer-events-none opacity-40" : ""}`} dir="ltr" style={{ height }}>
      <div
        ref={ref}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={toFaDigits(value.toFixed(1))}
        aria-disabled={disabled || undefined}
        onScroll={onScroll}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            nudge(1);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            nudge(-1);
          }
        }}
        className="h-full overflow-x-auto overscroll-x-contain outline-none [scrollbar-width:none] focus-visible:rounded-[14px] focus-visible:ring-2 focus-visible:ring-border-focus [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: "linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent)" }}
      >
        <div className="relative h-full" style={{ width: steps * PX + half * 2 }}>
          {/* Ticks: a short one every step, a tall one every whole unit */}
          <div
            aria-hidden="true"
            className="absolute top-0"
            style={{
              left: half,
              width: steps * PX + 1,
              height: compact ? 20 : 28,
              backgroundImage: `repeating-linear-gradient(90deg, var(--color-violet-500) 0 1.5px, transparent 1.5px ${PX * stepsPerUnit * majorEvery}px), repeating-linear-gradient(90deg, var(--color-violet-200) 0 1px, transparent 1px ${PX}px)`,
              backgroundSize: `100% 100%, 100% 55%`,
              backgroundRepeat: "no-repeat",
            }}
          />
          {labels.map((u) => (
            <span
              key={u}
              aria-hidden="true"
              className={`absolute -translate-x-1/2 text-caption-small text-text-tertiary ${compact ? "top-6" : "top-9"}`}
              style={{ left: half + toLeft(u) }}
            >
              {toFaDigits(u)}
            </span>
          ))}
        </div>
      </div>
      {/* Center line: the value */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-brand"
        style={{ height: compact ? 30 : 40 }}
      />
    </div>
  );
}
