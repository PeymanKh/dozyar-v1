"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "plain";

type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: Variant;
  loading?: boolean;
  loadingLabel?: string;
  children: React.ReactNode;
};

const base =
  "relative inline-flex w-full select-none items-center justify-center gap-2.5 rounded-full text-label-button transition-[background,box-shadow,color,opacity] duration-200 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "h-[52px] px-6 bg-brand-gradient text-text-on-brand shadow-glow disabled:bg-none disabled:bg-surface-brand-soft disabled:text-text-tertiary disabled:shadow-none",
  secondary: "h-[52px] px-6 bg-surface text-text-primary shadow-card disabled:opacity-50",
  plain: "h-11 px-4 text-text-brand disabled:text-text-tertiary",
};

/**
 * Feedback starts on press (pointer down), not on release, and the press can be
 * interrupted: the scale is a spring, so it follows the finger back if the press is cancelled.
 */
export function Button({
  variant = "primary",
  loading = false,
  loadingLabel,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <motion.button
      type="button"
      disabled={isDisabled}
      aria-busy={loading || undefined}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
      className={`${base} ${variants[variant]} ${loading ? "!opacity-100" : ""} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner />
          <span>{loadingLabel ?? children}</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
