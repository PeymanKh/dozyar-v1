"use client";

import { motion } from "motion/react";
import { Check, ChevronBack } from "@/components/ui/icons";

/**
 * One choice in an onboarding list: icon, title, a short line, and a radio circle.
 * Every single-choice list in onboarding uses this card, so the screens read as one design.
 * Use inside a role="radiogroup". With `multi`, it is a checkbox (rounded square) for lists
 * where several can be chosen. With `opens`, it is a row that opens a sheet (a chevron
 * instead of the radio), for optional details.
 */
export function OptionCard({
  icon,
  title,
  line,
  selected = false,
  onChoose,
  opens = false,
  multi = false,
}: {
  /** 52px slot: a glass icon, a flag, or a line icon in a soft circle. Omit for text-only lists. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  line?: React.ReactNode;
  selected?: boolean;
  onChoose: () => void;
  opens?: boolean;
  multi?: boolean;
}) {
  return (
    <motion.button
      type="button"
      role={opens ? undefined : multi ? "checkbox" : "radio"}
      aria-checked={opens ? undefined : selected}
      aria-haspopup={opens ? "dialog" : undefined}
      onClick={onChoose}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
      className={`flex min-h-[76px] w-full items-center gap-3.5 rounded-[20px] border px-4 py-3.5 text-start transition-[background-color,border-color] duration-200 ${
        selected
          ? "border-border-focus bg-surface-brand-subtle"
          : "border-violet-200 bg-surface active:bg-surface-brand-subtle"
      }`}
    >
      {icon ? <span className="grid size-13 shrink-0 place-items-center">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-body-strong text-text-primary">{title}</span>
        {line ? <span className="block text-caption text-pretty text-text-secondary">{line}</span> : null}
      </span>
      {opens ? (
        // "Forward" in RTL points left
        <ChevronBack size={20} aria-hidden="true" className="shrink-0 text-text-tertiary" />
      ) : (
        <span
          aria-hidden="true"
          className={`grid size-6 shrink-0 place-items-center border transition-colors duration-200 ${
            multi ? "rounded-[8px]" : "rounded-full"
          } ${selected ? "border-transparent bg-brand text-text-on-brand" : "border-violet-200"}`}
        >
          {selected ? <Check size={14} strokeWidth={3} /> : null}
        </span>
      )}
    </motion.button>
  );
}

/** A line icon in a soft lavender circle, sized like the other card icons. */
export function OptionGlyph({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-11 place-items-center rounded-full bg-surface-brand-subtle text-text-brand">
      {children}
    </span>
  );
}
