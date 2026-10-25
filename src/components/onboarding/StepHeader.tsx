"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ChevronBack } from "@/components/ui/icons";
import { toFaDigits } from "@/lib/digits";
import { SECTIONS, type Progress } from "@/lib/onboarding-flow";

/**
 * Glass back button on the left (floating layer, so glass is allowed) and the progress bar:
 * one segment per onboarding section, filling left to right (product decision, even in RTL).
 * On arrival the current segment grows from the previous screen to this one, so moving
 * forward is felt. Sign-in screens pass no progress and show only the back button.
 */
export function StepHeader({ progress, backHref }: { progress?: Progress; backHref?: string | null }) {
  const router = useRouter();

  return (
    <header className="flex h-11 items-center gap-4">
      {/* Balances the back button so the bar sits in the middle */}
      <span className="size-11 shrink-0" aria-hidden="true" />

      <div className="flex-1">{progress ? <ProgressBar progress={progress} /> : null}</div>

      {/* Back lives on the left edge: last in a right-to-left row. null = nowhere to go back to. */}
      {backHref === null ? (
        <span className="size-11 shrink-0" aria-hidden="true" />
      ) : (
        <motion.button
          type="button"
          aria-label="بازگشت"
          onClick={() => (backHref ? router.push(backHref) : router.back())}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="glass grid size-11 shrink-0 place-items-center rounded-full text-text-primary"
        >
          <ChevronBack size={22} />
        </motion.button>
      )}
    </header>
  );
}

function ProgressBar({ progress }: { progress: Progress }) {
  const reduce = useReducedMotion();
  const { section, screen, of } = progress;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={SECTIONS.length}
      aria-valuenow={section + screen / of}
      aria-label={`بخش ${toFaDigits(section + 1)} از ${toFaDigits(SECTIONS.length)}: ${SECTIONS[section].title}`}
      className="flex gap-1.5"
      dir="ltr"
    >
      {SECTIONS.map((s, i) => {
        const to = i < section ? 1 : i === section ? screen / of : 0;
        const from = i === section ? (screen - 1) / of : to;
        return (
          <div key={s.title} className="h-1 flex-1 overflow-hidden rounded-full bg-violet-100">
            <motion.div
              className="h-full origin-left rounded-full bg-brand"
              initial={{ scaleX: reduce ? to : from }}
              animate={{ scaleX: to }}
              transition={{ type: "spring", bounce: 0, duration: 0.7, delay: 0.15 }}
            />
          </div>
        );
      })}
    </div>
  );
}
