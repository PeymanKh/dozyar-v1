"use client";

import { motion } from "motion/react";

/**
 * The brand-gradient card that holds a screen's one main thing (the next injection on Today,
 * logging how you feel on حال من), with its white action button.
 */

// overflow-clip, not hidden: the glow overflows, and a hidden overflow can still be
// scrolled (focusing the button would slide the content up inside the card).
export function HeroFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section
      aria-label={label}
      className="relative overflow-clip rounded-[28px] bg-brand-gradient p-5 text-white shadow-hero"
    >
      {/* Light falling on the card from the top corner */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -right-20 size-64 rounded-full bg-white/14 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-10 size-48 rounded-full bg-violet-300/20 blur-2xl"
      />
      <div className="relative">{children}</div>
    </section>
  );
}

export function HeroActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 flex items-center gap-2">{children}</div>;
}

export function HeroButton({
  children,
  onClick,
  quiet = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  quiet?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
      className={`h-12 flex-1 rounded-full text-label-button ${
        quiet ? "bg-white/14 text-white" : "bg-white text-text-brand shadow-[0_8px_18px_-8px_rgb(30_27_51/0.45)]"
      }`}
    >
      {children}
    </motion.button>
  );
}
