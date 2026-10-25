"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Page frame for app screens. Tab screens fade in (they are peers, so nothing slides);
 * pushed screens (`pushed`) enter from the left, the forward direction in a right-to-left
 * interface, like the onboarding steps. Leaves room at the bottom for the tab bar.
 */
export function Screen({ children, pushed = false }: { children: React.ReactNode; pushed?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.main
      className={`bg-app min-h-dvh ${
        pushed ? "pb-[max(env(safe-area-inset-bottom),24px)]" : "pb-[calc(max(env(safe-area-inset-bottom),14px)+104px)]"
      }`}
      initial={reduce ? { opacity: 0 } : pushed ? { opacity: 0, x: -24 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.45 }}
    >
      {children}
    </motion.main>
  );
}
