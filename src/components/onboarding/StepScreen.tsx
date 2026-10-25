"use client";

import Image, { type StaticImageData } from "next/image";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { StepHeader } from "./StepHeader";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
import type { Progress } from "@/lib/onboarding-flow";

/**
 * Shared frame for onboarding steps: header, a glass object with its title and description,
 * the step's content, and an optional bottom action that rides on top of the keyboard.
 * New steps enter from the left, the "forward" direction in a right-to-left interface.
 */
export function StepScreen({
  progress,
  backHref,
  icon,
  title,
  description,
  children,
  action,
}: {
  progress?: Progress;
  /** Where back goes; omitted = browser back; null = no back button. */
  backHref?: string | null;
  icon?: StaticImageData;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const keyboard = useKeyboardInset();

  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", bounce: 0, duration: 0.5 } },
  };

  return (
    <div className="bg-step relative flex min-h-dvh flex-col">
      <div className="relative z-10 px-5 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="pt-1">
          <StepHeader progress={progress} backHref={backHref} />
        </div>
      </div>

      <motion.main
        className="relative z-10 flex flex-1 flex-col px-6 pt-6"
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.05 }}
      >
        {icon ? (
          <motion.div variants={item} className="relative mx-auto mb-4 grid size-[104px] place-items-center">
            <div aria-hidden="true" className="halo absolute -inset-6" />
            <motion.div
              className="relative"
              initial={reduce ? false : { scale: 0.86, filter: "blur(8px)" }}
              animate={{ scale: 1, filter: "blur(0px)" }}
              transition={{ type: "spring", bounce: 0, duration: 0.8 }}
            >
              <Image src={icon} alt="" width={96} height={96} loading="eager" className="size-24 object-contain" />
            </motion.div>
          </motion.div>
        ) : null}

        <motion.h1 variants={item} className="text-center text-title-large text-text-primary">
          {title}
        </motion.h1>
        {description ? (
          <motion.div variants={item} className="mt-1.5 text-center text-body-small text-balance text-text-secondary">
            {description}
          </motion.div>
        ) : null}

        <motion.div variants={item} className="mt-8 flex flex-col">
          {children}
        </motion.div>
      </motion.main>

      {action ? (
        // Scroll edge: content fades under the action instead of hitting a hard line.
        <div
          className="sticky bottom-0 z-20 bg-linear-to-t from-bg-canvas from-60% to-bg-canvas/0 px-6 pt-8 transition-[padding] duration-200 ease-out-soft"
          style={{
            paddingBottom: keyboard > 0 ? keyboard + 12 : "max(env(safe-area-inset-bottom), 20px)",
          }}
        >
          {action}
        </div>
      ) : null}
    </div>
  );
}
