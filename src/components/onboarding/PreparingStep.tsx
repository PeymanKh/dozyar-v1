"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/Spinner";
import { useOnboarding, type OnboardingState } from "@/lib/onboarding-store";
import { doseLabel, formatKg, medicationName, reminderLabel, rhythmOf } from "@/lib/plan";
import plantIcon from "../../../public/onboarding/journey-plant.png";

const RING = 196;
const STROKE = 10;

/** The four things the plan is made of, in the person's own answers. */
function planLines(s: OnboardingState): string[] {
  const drug = medicationName(s.medication);
  const dose = doseLabel(s.dose);
  const lines = [drug ? `داروت: ${drug}${dose ? `، ${dose}` : ""}` : "داروت رو بعداً اضافه می‌کنی"];
  if (s.schedule) lines.push(`تزریق: ${reminderLabel(s.schedule, rhythmOf(s.medication))}`);
  if (s.weight) {
    lines.push(
      typeof s.goal === "number"
        ? `از ${formatKg(s.weight.today)} تا ${formatKg(s.goal)} کیلو`
        : `نقطه‌ی شروع: ${formatKg(s.weight.today)} کیلو`,
    );
  }
  const channel = s.reminders?.channel;
  lines.push(channel === "push" ? "یادآوری‌ها روشن شد" : channel === "sms" ? "یادآوری با پیامک میاد" : "یادآوری‌ها فعلاً خاموشه");
  return lines;
}

/**
 * After the last question: one orchestrated moment that turns the answers into the plan.
 * The ring fills as each line of the plan is checked off, the glass plant grows in the
 * middle, then «همه‌چی آماده‌ست!» and Today opens. Every line is real, read from the answers.
 */
export function PreparingStep() {
  const router = useRouter();
  const state = useOnboarding();
  const reduce = useReducedMotion();
  const name = state.name?.trim();
  const lines = planLines(state);
  const [done, setDone] = useState(0);
  const finished = done >= lines.length;
  const step = reduce ? 350 : 800;

  // Check off one line at a time, then open Today.
  useEffect(() => {
    if (finished) {
      if ("vibrate" in navigator) navigator.vibrate?.(14);
      const id = setTimeout(() => router.replace("/today"), reduce ? 700 : 1400);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setDone((d) => d + 1), done === 0 ? step + 300 : step);
    return () => clearTimeout(id);
  }, [done, finished, reduce, router, step]);

  const r = (RING - STROKE) / 2;

  return (
    <main className="bg-step flex min-h-dvh flex-col items-center px-6 pt-[max(env(safe-area-inset-top),48px)] pb-[max(env(safe-area-inset-bottom),24px)]">
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* The ring and the plant */}
        <motion.div
          className="relative grid place-items-center"
          style={{ width: RING, height: RING }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ type: "spring", bounce: 0, duration: 0.9 }}
        >
          <div aria-hidden="true" className="halo absolute -inset-8" />
          <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx={RING / 2} cy={RING / 2} r={r} fill="none" stroke="var(--color-violet-100)" strokeWidth={STROKE} />
            <motion.circle
              cx={RING / 2}
              cy={RING / 2}
              r={r}
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: done / lines.length }}
              transition={{ type: "spring", bounce: 0, duration: reduce ? 0.2 : 0.7 }}
            />
          </svg>
          <motion.div
            animate={reduce ? undefined : { scale: 0.82 + (0.18 * done) / lines.length }}
            initial={reduce ? undefined : { scale: 0.82 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          >
            <Image src={plantIcon} alt="" width={112} height={112} loading="eager" className="size-28 object-contain" />
          </motion.div>
          <AnimatePresence>
            {finished ? (
              <motion.span
                key="done"
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
                className="absolute -bottom-1 grid size-11 place-items-center rounded-full bg-brand-gradient text-text-on-brand shadow-glow"
              >
                <Check size={22} strokeWidth={3} />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </motion.div>

        {/* The title: preparing, then ready */}
        <div className="mt-10 grid min-h-[72px] place-items-center text-center" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={finished ? "ready" : "preparing"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="text-title-large text-balance text-text-primary"
            >
              {finished
                ? name
                  ? `همه‌چی آماده‌ست، ${name}!`
                  : "همه‌چی آماده‌ست!"
                : name
                  ? `${name}، داریم برنامه‌ات رو آماده می‌کنیم`
                  : "داریم برنامه‌ات رو آماده می‌کنیم"}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* The plan, checked off line by line */}
        <ul className="mt-6 flex w-full max-w-[19rem] flex-col gap-3">
          {lines.map((line, i) => {
            const visible = i <= done;
            const checked = i < done;
            return (
              <motion.li
                key={line}
                initial={false}
                animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ type: "spring", bounce: 0, duration: 0.45 }}
                className="flex items-center gap-3"
                aria-hidden={!visible}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-300 ${
                    checked ? "bg-brand text-text-on-brand" : "text-brand"
                  }`}
                >
                  {checked ? <Check size={14} strokeWidth={3} /> : <Spinner size={16} />}
                </span>
                <span className={`text-body-small transition-colors duration-300 ${checked ? "text-text-primary" : "text-text-secondary"}`}>
                  {line}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
