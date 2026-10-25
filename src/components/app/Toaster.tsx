"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "@/components/ui/icons";
import { dismissToast, useToast } from "@/lib/ui-store";

/**
 * A short confirmation that rises above the tab bar and leaves on its own. When it carries
 * an action (undo), the action sits at its end. Announced politely, never steals focus.
 */
export function Toaster({ aboveTabBar }: { aboveTabBar: boolean }) {
  const toast = useToast();
  const reduce = useReducedMotion();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-[60] mx-auto flex max-w-[480px] justify-center px-4"
      style={{
        bottom: aboveTabBar
          ? "calc(max(env(safe-area-inset-bottom), 14px) + 78px)"
          : "calc(max(env(safe-area-inset-bottom), 16px) + 84px)",
      }}
    >
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            role="status"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.18 } }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="pointer-events-auto flex min-h-12 max-w-full items-center gap-2.5 rounded-full bg-ink-900/92 py-1.5 ps-4 pe-1.5 text-white shadow-[0_14px_30px_-12px_rgb(30_27_51/0.55)] backdrop-blur-md"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-violet-500">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1 text-label">{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  toast.action!.run();
                  dismissToast();
                }}
                className="h-9 shrink-0 rounded-full bg-white/12 px-4 text-label text-violet-200 active:bg-white/20"
              >
                {toast.action.label}
              </button>
            ) : (
              <span className="w-2" />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
