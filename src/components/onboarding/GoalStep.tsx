"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BigNumber } from "@/components/ui/BigNumber";
import { StepScreen } from "./StepScreen";
import { Button } from "@/components/ui/Button";
import { Ruler } from "@/components/ui/Ruler";
import { progressFor } from "@/lib/onboarding-flow";
import { setOnboarding, useOnboarding } from "@/lib/onboarding-store";
import { formatKg, healthyFloorKg } from "@/lib/plan";
import goalIcon from "../../../public/onboarding/goal.png";

/**
 * Screen 8 (required; product decision, the spec had a skip). Powers the progress ring on
 * Today. One card: the goal on the ruler and how far it is from today. Weight-loss speed is
 * not asked on purpose: a pace target pushes people and is risky for anyone with disordered
 * eating.
 */
export function GoalStep() {
  const router = useRouter();
  const { weight, about, goal } = useOnboarding();
  const today = weight?.today ?? 80;
  const [value, setValue] = useState<number | null>(null);
  const goalKg = value ?? (typeof goal === "number" ? goal : Math.max(40, Math.round((today - 5) * 10) / 10));
  const toGo = Math.round((today - goalKg) * 10) / 10;
  // Inform, don't block: below the healthy range a note appears; the button still works.
  const belowHealthy = about ? goalKg < healthyFloorKg(about.height) : false;

  function next(answer: number) {
    setOnboarding({ goal: answer });
    router.push("/onboarding/worries");
  }

  return (
    <StepScreen
      progress={progressFor(8)}
      backHref="/onboarding/weight"
      icon={goalIcon}
      title="هدفت چند کیلوئه؟"
      description="یه عدد تقریبی کافیه. با پزشکت هم درباره‌اش حرف بزن."
      action={<Button onClick={() => next(goalKg)}>ادامه</Button>}
    >
      <div className="flex flex-col gap-3 pb-4">
        <div className="flex flex-col gap-3 rounded-[24px] border border-violet-200 bg-surface px-4 pt-5 pb-5">
          <BigNumber value={goalKg} />
          <p className="-mt-1 min-h-5 text-center text-caption text-text-secondary" aria-live="polite">
            {toGo >= 0.1 ? `${formatKg(toGo)} کیلو تا هدف` : ""}
          </p>
          <Ruler min={40} max={250} value={goalKg} onChange={setValue} label="وزن هدف به کیلوگرم" />
        </div>

        {belowHealthy ? (
          <p className="px-1 text-center text-caption text-balance text-text-brand" role="status">
            این هدف زیر محدوده‌ی وزن سالمه. بهتره با پزشکت مشورت کنی.
          </p>
        ) : null}
      </div>
    </StepScreen>
  );
}
