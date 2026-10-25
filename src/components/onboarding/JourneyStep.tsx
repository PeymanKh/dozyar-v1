"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { OptionCard } from "@/components/ui/OptionCard";
import { StepScreen } from "./StepScreen";
import { Button } from "@/components/ui/Button";
import { progressFor } from "@/lib/onboarding-flow";
import { setOnboarding, useOnboarding, type Journey } from "@/lib/onboarding-store";
import journeyIcon from "../../../public/onboarding/journey.png";
import seedIcon from "../../../public/onboarding/journey-seed.png";
import sproutIcon from "../../../public/onboarding/journey-sprout.png";
import plantIcon from "../../../public/onboarding/journey-plant.png";

/** Growth stages: a seed (not started), a sprout (just started), a young plant (a while). */
const OPTIONS: { value: Journey; title: string; line: string; icon: StaticImageData }[] = [
  { value: "not-started", title: "هنوز شروع نکردم", line: "پزشکم تجویز کرده و به‌زودی شروع می‌کنم", icon: seedIcon },
  { value: "just-started", title: "تازه شروع کردم", line: "کمتر از یک ماهه که تزریق می‌کنم", icon: sproutIcon },
  { value: "a-while", title: "چند وقته مصرف می‌کنم", line: "بیشتر از یک ماهه", icon: plantIcon },
];

/**
 * Screen 2 (required). Decides the extra questions later. Three cards, one choice, then
 * «ادامه», like every other step.
 */
export function JourneyStep() {
  const router = useRouter();
  const saved = useOnboarding().journey;
  const [picked, setPicked] = useState<Journey | null>(null);
  const current = picked ?? saved;

  function next() {
    if (!current) return;
    setOnboarding({ journey: current });
    router.push("/onboarding/medication");
  }

  return (
    <StepScreen
      progress={progressFor(2)}
      backHref="/onboarding/name"
      icon={journeyIcon}
      title="کجای مسیری؟"
      description="تا برنامه‌ات رو از همون جایی که هستی شروع کنیم."
      action={
        <Button disabled={!current} onClick={next}>
          ادامه
        </Button>
      }
    >
      <div role="radiogroup" aria-label="کجای مسیری؟" className="flex flex-col gap-3">
        {OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            icon={<Image src={o.icon} alt="" width={52} height={52} className="size-13 object-contain" />}
            title={o.title}
            line={o.line}
            selected={current === o.value}
            onChoose={() => setPicked(o.value)}
          />
        ))}
      </div>
    </StepScreen>
  );
}
