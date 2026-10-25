"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * The cycle ring: how much of the time between two doses has passed, with the time left in
 * the middle. `light` is for the brand-gradient card (white on violet).
 */
export function CountdownRing({
  size = 104,
  progress,
  primary,
  secondary,
  center,
  tone = "brand",
}: {
  size?: number;
  progress: number;
  /** A number on its own reads large; a word («وقتشه») smaller, so both fit inside the ring. */
  primary?: string;
  secondary?: string;
  /** Replaces the text, e.g. a check mark. */
  center?: React.ReactNode;
  tone?: "brand" | "light";
}) {
  const reduce = useReducedMotion();
  const stroke = Math.round(size * 0.085);
  const r = (size - stroke) / 2;
  const light = tone === "light";

  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={light ? "rgb(255 255 255 / 0.2)" : "var(--color-violet-100)"}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={light ? "white" : "var(--color-brand)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: reduce ? progress : 0 }}
          animate={{ pathLength: progress }}
          transition={{ type: "spring", bounce: 0, duration: 1.1, delay: 0.1 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {center ?? (
          <>
            <span
              className={`font-display leading-none font-bold tracking-tight ${
                (primary?.length ?? 0) <= 3 ? "text-[30px]" : "text-[19px]"
              } ${light ? "text-white" : "text-text-primary"}`}
            >
              {primary}
            </span>
            {secondary ? (
              <span className={`mt-1.5 text-caption-small ${light ? "text-white/80" : "text-text-secondary"}`}>
                {secondary}
              </span>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
