"use client";

import { motion } from "motion/react";

/**
 * Selectable pill. `round` makes a 44px circle (weekday picker).
 * Use inside a role="radiogroup" (one choice) or role="group" (several, aria-pressed).
 */
export function Chip({
  selected,
  onClick,
  round = false,
  multi = false,
  disabled = false,
  className = "",
  children,
  ...rest
}: {
  selected: boolean;
  onClick: () => void;
  round?: boolean;
  /** Several can be chosen: announced as a toggle button instead of a radio. */
  multi?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof motion.button>, "onClick" | "children">) {
  return (
    <motion.button
      type="button"
      role={multi ? undefined : "radio"}
      aria-checked={multi ? undefined : selected}
      aria-pressed={multi ? selected : undefined}
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: "spring", bounce: 0, duration: 0.25 }}
      className={`border text-label transition-[background-color,border-color,color] duration-150 disabled:opacity-40 ${
        round ? "grid size-11 place-items-center rounded-full" : "h-11 rounded-full px-4"
      } ${
        selected
          ? "border-transparent bg-brand text-text-on-brand"
          : "border-violet-200 bg-surface text-text-primary active:bg-surface-brand-subtle"
      } ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
