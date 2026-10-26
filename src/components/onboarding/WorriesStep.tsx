"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OptionCard } from "@/components/ui/OptionCard";
import { StepScreen } from "./StepScreen";
import { Button } from "@/components/ui/Button";
import { progressFor } from "@/lib/onboarding-flow";
import { isInjecting, setOnboarding, useOnboarding } from "@/lib/onboarding-store";
import worriesIcon from "../../../public/onboarding/worries.png";

export const FEAR_OF_INJECTING = "ترس از تزریق";

const SECTIONS = [
  { title: "عوارض", items: ["حالت تهوع", "یبوست", "اسهال", "خستگی", "ریزش مو", "از دست دادن عضله"] },
  { title: "درباره‌ی درمان", items: ["برگشت وزن بعد از قطع دارو", FEAR_OF_INJECTING, "هزینه‌ی دارو"] },
];

/**
 * Screen 9 (optional). Picks the first questions the assistant offers (on Today and in the
 * chat), and tells people these worries are common. Same cards as the other screens, as checkboxes: any number can be chosen, and
 * «ادامه» works with none (so there is no separate skip).
 */
export function WorriesStep() {
  const router = useRouter();
  const { journey, worries } = useOnboarding();
  const [picked, setPicked] = useState<string[] | null>(null);
  const chosen = picked ?? worries ?? [];

  // Builds on the latest selection, so quick taps in a row all count.
  function toggle(w: string) {
    setPicked((prev) => {
      const base = prev ?? worries ?? [];
      return base.includes(w) ? base.filter((x) => x !== w) : [...base, w];
    });
  }

  function next() {
    setOnboarding({ worries: chosen });
    router.push("/onboarding/reminders");
  }

  return (
    <StepScreen
      progress={progressFor(9)}
      backHref="/onboarding/goal"
      icon={worriesIcon}
      title="نگران چی هستی؟"
      description={
        isInjecting(journey)
          ? "کدوما این روزها اذیتت می‌کنن یا نگرانشونی؟"
          : "خیلی‌ها اول مسیر همین نگرانی‌ها رو دارن. برای هرکدوم کنارتیم."
      }
      action={<Button onClick={next}>ادامه</Button>}
    >
      <div className="flex flex-col gap-6 pb-4">
        {SECTIONS.map((section) => (
          <section key={section.title} role="group" aria-label={section.title} className="flex flex-col gap-3">
            <h2 className="px-1 text-caption text-text-tertiary">{section.title}</h2>
            {section.items.map((w) => (
              <OptionCard key={w} multi title={w} selected={chosen.includes(w)} onChoose={() => toggle(w)} />
            ))}
          </section>
        ))}
      </div>
    </StepScreen>
  );
}
