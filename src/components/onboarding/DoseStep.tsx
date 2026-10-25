"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { OptionCard } from "@/components/ui/OptionCard";
import { StepScreen } from "./StepScreen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { toEnDigits } from "@/lib/digits";
import { findMedication } from "@/lib/medications";
import { progressFor } from "@/lib/onboarding-flow";
import { isInjecting, setOnboarding, useOnboarding, type DoseAnswer } from "@/lib/onboarding-store";
import { formatMg } from "@/lib/plan";
import doseIcon from "../../../public/onboarding/dose.png";

type Pick = { kind: "preset"; mg: number } | { kind: "other"; text: string } | { kind: "unsure" };

/** "۰٫۵" / "0.5" / "0,5" -> 0.5 */
function parseMg(text: string): number | null {
  const n = Number(toEnDigits(text).replace(/[٫,]/g, ".").trim());
  return text.trim() && Number.isFinite(n) && n > 0 && n <= 50 ? n : null;
}

const reveal = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { type: "spring" as const, bounce: 0, duration: 0.3 },
};

/**
 * Screen 4 (required, "not sure" allowed). Same cards as screens 2 and 3: the drug's doses,
 * then «سایر» (another dose, not sure). We never suggest or change a dose: the person
 * records what their doctor prescribed, then confirms with «ادامه».
 */
export function DoseStep() {
  const router = useRouter();
  const { journey, medication, dose } = useOnboarding();
  const med = medication && "id" in medication ? findMedication(medication.id) : undefined;
  const doses = med?.doses ?? [];
  const [pick, setPick] = useState<Pick | null>(null);

  const current: Pick | null =
    pick ??
    (dose === null
      ? null
      : "unknown" in dose
        ? { kind: "unsure" }
        : doses.includes(dose.mg)
          ? { kind: "preset", mg: dose.mg }
          : { kind: "other", text: formatMg(dose.mg) });

  const otherText = current?.kind === "other" ? current.text : "";
  const answer: DoseAnswer | null =
    current?.kind === "preset"
      ? { mg: current.mg }
      : current?.kind === "unsure"
        ? { unknown: true }
        : parseMg(otherText) !== null
          ? { mg: parseMg(otherText)! }
          : null;

  function next() {
    if (!answer) return;
    setOnboarding({ dose: answer });
    router.push("/onboarding/schedule");
  }

  return (
    <StepScreen
      progress={progressFor(4)}
      backHref="/onboarding/medication"
      icon={doseIcon}
      title={isInjecting(journey) ? "دوز فعلی‌ات چقدره؟" : "دوز شروعت چقدره؟"}
      description="همون دوزی که پزشکت تجویز کرده. ما دوز رو عوض نمی‌کنیم، فقط ثبتش می‌کنیم."
      action={
        <Button disabled={!answer} onClick={next}>
          ادامه
        </Button>
      }
    >
      <div role="radiogroup" aria-label="دوز" className="flex flex-col gap-6 pb-4">
        {med ? (
          <section aria-label={`دوزهای ${med.fa}`} className="flex flex-col gap-3">
            <h2 className="px-1 text-caption text-text-tertiary">دوزهای {med.fa}</h2>
            {doses.map((mg) => (
              <OptionCard
                key={mg}
                title={`${formatMg(mg)} میلی‌گرم`}
                selected={current?.kind === "preset" && current.mg === mg}
                onChoose={() => setPick({ kind: "preset", mg })}
              />
            ))}
          </section>
        ) : null}

        <section aria-label="سایر" className="flex flex-col gap-3">
          <h2 className="px-1 text-caption text-text-tertiary">سایر</h2>
          <OptionCard
            title={med ? "دوز دیگه‌ای" : "دوز رو خودم می‌نویسم"}
            line="عددش رو به میلی‌گرم وارد می‌کنی"
            selected={current?.kind === "other"}
            onChoose={() => current?.kind !== "other" && setPick({ kind: "other", text: "" })}
          />
          <AnimatePresence initial={false}>
            {current?.kind === "other" ? (
              <motion.div key="field" {...reveal} className="relative">
                <TextField
                  inputMode="decimal"
                  enterKeyHint="done"
                  autoFocus
                  aria-label="دوز به میلی‌گرم"
                  placeholder="مثلاً ۰٫۵"
                  value={otherText}
                  onChange={(e) => setPick({ kind: "other", text: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  className="pe-20 text-center"
                />
                <span className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-label text-text-tertiary">
                  میلی‌گرم
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <OptionCard
            title="مطمئن نیستم"
            line="بعداً از روی برچسب قلم یا نسخه واردش می‌کنی"
            selected={current?.kind === "unsure"}
            onChoose={() => setPick({ kind: "unsure" })}
          />
        </section>
      </div>
    </StepScreen>
  );
}
