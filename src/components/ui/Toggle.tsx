"use client";

import { motion } from "motion/react";
import { useId } from "react";

/**
 * A setting row: label and helper text on one side, an iOS-style switch on the other.
 * The whole row is the switch, so it is easy to hit; the knob springs across.
 */
export function Toggle({
  checked,
  onChange,
  label,
  helper,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  helper?: string;
}) {
  const helperId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={helper ? helperId : undefined}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-4 px-4 py-3.5 text-start active:bg-surface-brand-subtle"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-body-strong text-text-primary">{label}</span>
        {helper ? (
          <span id={helperId} className="block text-caption text-pretty text-text-secondary">
            {helper}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        dir="ltr"
        className={`flex h-[30px] w-[50px] shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
          checked ? "justify-end bg-brand" : "justify-start bg-violet-200"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
          className="size-[26px] rounded-full bg-white shadow-[0_2px_6px_rgb(30_27_51/0.2)]"
        />
      </span>
    </button>
  );
}
