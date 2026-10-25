"use client";

import { motion } from "motion/react";
import { useId } from "react";

/**
 * Segmented control: one choice among a few. The selected thumb slides between options
 * (shared layout animation), so the change reads as one object moving, not two blinking.
 * Nothing is selected until the person picks.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-[16px] border border-violet-200 bg-surface p-1">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`relative h-11 flex-1 rounded-[12px] text-label transition-colors duration-150 ${
              selected ? "text-text-on-brand" : "text-text-primary"
            }`}
          >
            {selected ? (
              <motion.span
                layoutId={`segmented-${id}`}
                className="absolute inset-0 rounded-[12px] bg-brand"
                transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              />
            ) : null}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
