"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { OptionCard, OptionGlyph } from "@/components/ui/OptionCard";
import { StepScreen } from "./StepScreen";
import { WeightSheet } from "@/components/ui/WeightSheet";
import { Button } from "@/components/ui/Button";
import { Flag, WeightIcon } from "@/components/ui/icons";
import { progressFor } from "@/lib/onboarding-flow";
import { isInjecting, setOnboarding, useOnboarding } from "@/lib/onboarding-store";
import { formatKg } from "@/lib/plan";
import weightIcon from "../../../public/onboarding/weight.png";

/**
 * Screen 7 (required). Rows that open a weight sheet: today's weight (the baseline for every
 * chart) and, for people already injecting, the starting weight so the progress they made
 * isn't lost.
 */
export function WeightStep() {
  const router = useRouter();
  const { journey, weight } = useOnboarding();
  const injecting = isInjecting(journey);
  const [today, setToday] = useState<number | undefined>(undefined);
  // undefined = not given, null = "I don't remember"
  const [start, setStart] = useState<number | null | undefined>(undefined);
  const [sheet, setSheet] = useState<"today" | "start" | null>(null);

  const todayKg = today ?? weight?.today;
  const startKg = start === undefined ? weight?.start : start;
  const lost = typeof startKg === "number" && todayKg !== undefined ? Math.round((startKg - todayKg) * 10) / 10 : 0;

  function next() {
    if (todayKg === undefined) return;
    setOnboarding({ weight: { today: todayKg, ...(injecting ? { start: startKg } : {}) } });
    router.push("/onboarding/goal");
  }

  return (
    <StepScreen
      progress={progressFor(7)}
      backHref="/onboarding/about"
      icon={weightIcon}
      title={injecting ? "وزنت از کجا شروع شد؟" : "وزن امروزت"}
      description={
        injecting
          ? "وزن امروز و وزنی که باهاش شروع کردی. فقط خودت می‌بینیش."
          : "فقط خودت می‌بینیش. لازم نیست دقیق باشه، هر وقت خواستی عوضش می‌کنی."
      }
      action={
        <Button disabled={todayKg === undefined} onClick={next}>
          ادامه
        </Button>
      }
    >
      <div className="flex flex-col gap-3 pb-4">
        <OptionCard
          opens
          icon={
            <OptionGlyph>
              <WeightIcon size={20} />
            </OptionGlyph>
          }
          title="وزن امروز"
          line={todayKg !== undefined ? `${formatKg(todayKg)} کیلوگرم` : "بزن تا وارد کنی"}
          onChoose={() => setSheet("today")}
        />
        {injecting ? (
          <OptionCard
            opens
            icon={
              <OptionGlyph>
                <Flag size={20} />
              </OptionGlyph>
            }
            title="وزن شروع"
            line={
              typeof startKg === "number"
                ? `${formatKg(startKg)} کیلوگرم`
                : startKg === null
                  ? "یادم نیست؛ وزن امروز نقطه‌ی شروع می‌شه"
                  : "اختیاری؛ وزنت وقتی تزریق رو شروع کردی"
            }
            onChoose={() => setSheet("start")}
          />
        ) : (
          <p className="px-1 text-center text-caption text-text-brand">این می‌شه نقطه‌ی شروعت.</p>
        )}

        {/* A small celebration when they already lost weight; nothing is said otherwise. */}
        <AnimatePresence initial={false}>
          {lost >= 0.1 ? (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2 text-center text-label text-text-brand"
              aria-live="polite"
            >
              تا الان {formatKg(lost)} کیلو کم کردی. آفرین!
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <WeightSheet
        open={sheet === "today"}
        onClose={() => setSheet(null)}
        title="وزن امروز"
        initial={todayKg ?? 80}
        onSave={setToday}
      />
      {injecting ? (
        <WeightSheet
          open={sheet === "start"}
          onClose={() => setSheet(null)}
          title="وزن شروع"
          initial={typeof startKg === "number" ? startKg : (todayKg ?? 80)}
          onSave={setStart}
          extra={
            <Button
              variant="plain"
              onClick={() => {
                setStart(null);
                setSheet(null);
              }}
            >
              یادم نیست
            </Button>
          }
        />
      ) : null}
    </StepScreen>
  );
}
