"use client";

import { motion } from "motion/react";
import { Droplet } from "@/components/ui/icons";
import { setWater, useAppData, waterOn } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { haptic } from "@/lib/ui-store";

/**
 * Today's water as a row of glasses: tap the next empty one to add a glass, tap the last full
 * one to take it back. There is always one empty glass to tap, even past the target.
 */
export function WaterPips({
  date,
  target,
  tone = "brand",
  size = 30,
}: {
  date: string;
  target: number;
  tone?: "brand" | "light";
  size?: number;
}) {
  const { water } = useAppData();
  const glasses = waterOn(water, date);
  const count = Math.min(12, Math.max(target, glasses + 1));
  const light = tone === "light";

  return (
    <div role="group" aria-label={`آب: ${toFaDigits(glasses)} از ${toFaDigits(target)} لیوان`} className="flex flex-wrap gap-1.5">
      {Array.from({ length: count }, (_, i) => {
        const full = i < glasses;
        const next = full && i === glasses - 1 ? i : i + 1;
        return (
          <motion.button
            key={i}
            type="button"
            aria-label={full ? `لیوان ${toFaDigits(i + 1)}، پر. برای برداشتن بزن` : `لیوان ${toFaDigits(i + 1)}`}
            aria-pressed={full}
            onClick={() => {
              setWater(date, next);
              haptic(6);
            }}
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            className={`grid place-items-center rounded-full transition-colors duration-200 ${
              full
                ? light
                  ? "bg-white text-text-brand"
                  : "bg-brand text-text-on-brand"
                : light
                  ? "border border-dashed border-white/50 text-white/60"
                  : "border border-dashed border-violet-300 text-violet-300"
            } ${i >= target ? "opacity-80" : ""}`}
            style={{ width: size, height: size }}
          >
            <Droplet size={Math.round(size * 0.5)} strokeWidth={2.2} fill={full ? "currentColor" : "none"} />
          </motion.button>
        );
      })}
    </div>
  );
}
