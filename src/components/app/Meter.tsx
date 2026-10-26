"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * A value against its target as a bar on a track of the same hue (fiber, water, a day's
 * protein). Fills from the left like every bar in the app. `light` is for the brand card.
 */
export function Meter({
  value,
  target,
  label,
  valueLabel,
  icon,
  tone = "brand",
  height = 8,
}: {
  value: number;
  target: number;
  label: string;
  /** «۱۲ از ۲۵ گرم» */
  valueLabel: string;
  icon?: React.ReactNode;
  tone?: "brand" | "light";
  height?: number;
}) {
  const reduce = useReducedMotion();
  const share = target > 0 ? Math.min(1, Math.max(0, value / target)) : 0;
  const light = tone === "light";

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className={`flex items-center gap-1.5 text-caption ${light ? "text-white/85" : "text-text-secondary"}`}>
          {icon}
          {label}
        </span>
        <span className={`text-caption-small ${light ? "text-white" : "text-text-primary"}`}>{valueLabel}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.round(value)}
        aria-valuetext={valueLabel}
        dir="ltr"
        className={`relative mt-1.5 overflow-hidden rounded-full ${light ? "bg-white/20" : "bg-violet-100"}`}
        style={{ height }}
      >
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${light ? "bg-white" : "bg-brand"}`}
          initial={{ width: reduce ? `${share * 100}%` : 0 }}
          animate={{ width: `${share * 100}%` }}
          transition={{ type: "spring", bounce: 0, duration: 0.9, delay: 0.1 }}
        />
      </div>
    </div>
  );
}
