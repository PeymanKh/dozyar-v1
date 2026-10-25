"use client";

import { motion, useReducedMotion } from "motion/react";
import { toFaDigits } from "@/lib/digits";

/**
 * The real "time until next dose" ring from the app, shown on the welcome screen as a preview.
 * The arc fills to how much of the week has passed since the last dose.
 */
export function DoseRing({
  size = 112,
  progress,
  days,
  hours,
  primary,
  secondary,
  delay = 0,
}: {
  size?: number;
  progress: number; // 0..1, share of the cycle already passed
  days?: number;
  hours?: number;
  /** Custom center text instead of days and hours, e.g. «۶ ساعت» / «مونده». */
  primary?: string;
  secondary?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const stroke = Math.round(size * 0.085);
  const r = (size - stroke) / 2;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-violet-100)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: reduce ? progress : 0 }}
          animate={{ pathLength: progress }}
          transition={{ type: "spring", bounce: 0, duration: 1.2, delay }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[22px] leading-none font-bold tracking-tight text-text-primary">
          {primary ?? `${toFaDigits(days ?? 0)} روز`}
        </span>
        <span className="mt-1 text-caption-small text-text-secondary">{secondary ?? `${toFaDigits(hours ?? 0)} ساعت`}</span>
      </div>
    </div>
  );
}
