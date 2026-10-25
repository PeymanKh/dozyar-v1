"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { OptionCard } from "@/components/ui/OptionCard";
import { StepScreen } from "./StepScreen";
import { Button } from "@/components/ui/Button";
import { WheelPicker } from "@/components/ui/WheelPicker";
import { toFaDigits } from "@/lib/digits";
import { progressFor } from "@/lib/onboarding-flow";
import { setOnboarding, useOnboarding, type AboutAnswer } from "@/lib/onboarding-store";
import aboutIcon from "../../../public/onboarding/about.png";

const OLDEST = 1320;
/** Born after this (under 18) the wheel stops. */
const YOUNGEST = 1387;
export const YEARS = Array.from({ length: YOUNGEST - OLDEST + 1 }, (_, i) => ({
  value: OLDEST + i,
  label: toFaDigits(OLDEST + i),
}));
export const HEIGHTS = Array.from({ length: 101 }, (_, i) => ({ value: 120 + i, label: toFaDigits(120 + i) }));
const SEXES: { value: AboutAnswer["sex"]; label: string }[] = [
  { value: "female", label: "زن" },
  { value: "male", label: "مرد" },
];

/** Screen 6 (required). BMI context on progress; protein and water targets later. */
export function AboutStep() {
  const router = useRouter();
  const saved = useOnboarding().about;
  const [draft, setDraft] = useState<Partial<AboutAnswer>>({});
  // Answers saved before the third option was removed are asked again.
  const savedSex = saved?.sex === "female" || saved?.sex === "male" ? saved.sex : null;
  const sex = draft.sex ?? savedSex;
  const birthYear = draft.birthYear ?? saved?.birthYear ?? 1365;
  const height = draft.height ?? saved?.height ?? 165;

  function next() {
    if (!sex) return;
    setOnboarding({ about: { sex, birthYear, height } });
    router.push("/onboarding/weight");
  }

  return (
    <StepScreen
      progress={progressFor(6)}
      backHref="/onboarding/schedule"
      icon={aboutIcon}
      title="کمی درباره‌ی خودت"
      description="برای اینکه عددها و پیشنهادها دقیق باشن."
      action={
        <Button disabled={!sex} onClick={next}>
          ادامه
        </Button>
      }
    >
      <div className="flex flex-col gap-6 pb-4">
        <section role="radiogroup" aria-label="جنسیت" className="flex flex-col gap-3">
          <h2 className="px-1 text-caption text-text-tertiary">جنسیت</h2>
          {SEXES.map((o) => (
            <OptionCard
              key={o.value}
              title={o.label}
              selected={sex === o.value}
              onChoose={() => setDraft((d) => ({ ...d, sex: o.value }))}
            />
          ))}
        </section>

        <section aria-label="سال تولد و قد" className="flex flex-col gap-3">
          <h2 className="px-1 text-caption text-text-tertiary">سال تولد و قد</h2>
          <div className="grid grid-cols-2 gap-3 rounded-[20px] border border-violet-200 bg-surface p-3">
            <div className="flex flex-col gap-1">
              <span className="text-center text-label text-text-secondary">سال تولد</span>
              <WheelPicker
                items={YEARS}
                value={birthYear}
                onChange={(v) => setDraft((d) => ({ ...d, birthYear: v }))}
                label="سال تولد"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-center text-label text-text-secondary">قد (سانتی‌متر)</span>
              <WheelPicker
                items={HEIGHTS}
                value={height}
                onChange={(v) => setDraft((d) => ({ ...d, height: v }))}
                label="قد به سانتی‌متر"
              />
            </div>
          </div>

          {/* Pending doctor review of the wording. */}
          <AnimatePresence initial={false}>
            {birthYear === YOUNGEST ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="px-1 text-caption text-pretty text-text-secondary"
              >
                اگه زیر ۱۸ سالی، این داروها فقط باید زیر نظر پزشک متخصص مصرف بشن.
              </motion.p>
            ) : null}
          </AnimatePresence>
        </section>
      </div>
    </StepScreen>
  );
}
