"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { HeroActions, HeroButton, HeroFrame } from "@/components/app/HeroCard";
import { Check } from "@/components/ui/icons";
import { MoodFace } from "@/components/ui/MoodFace";
import type { CheckIn } from "@/lib/app-store";
import { formatJalali } from "@/lib/jalali";
import { symptomEntries } from "@/lib/stats";
import { MOOD_LABEL, MOODS, SEVERITY_LABEL, SYMPTOM_LABEL } from "@/lib/symptoms";

/**
 * The main thing on حال من, on the brand card: logging today. Before: the question and five
 * faces (one tap opens the check-in with that face chosen). After: today's face, symptoms
 * and note, and «ویرایش».
 */
export function LogHero({ today, checkIn }: { today: string; checkIn: CheckIn | undefined }) {
  const router = useRouter();
  const open = (extra = "") => router.push(`/check-in?date=${today}${extra}`);

  if (!checkIn) {
    return (
      <HeroFrame label="ثبت حال امروز">
        <p className="text-caption text-white/80">{formatJalali(today)}</p>
        <h2 className="mt-1 font-display text-[22px] leading-snug font-bold">امروز حالت چطوره؟</h2>
        <p className="mt-1 text-body-small text-pretty text-white/85">
          یکی رو انتخاب کن؛ بعد اگه علامتی داری اضافه‌اش کن.
        </p>
        <div role="group" aria-label="حال امروز" className="mt-5 flex justify-between">
          {MOODS.map((m) => (
            <motion.button
              key={m.value}
              type="button"
              aria-label={`حالم ${m.label}ه`}
              onClick={() => open(`&mood=${m.value}`)}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", bounce: 0, duration: 0.25 }}
              className="flex w-14 flex-col items-center gap-1.5"
            >
              <span className="grid size-[54px] place-items-center rounded-full bg-white/16 text-white ring-1 ring-white/30 transition-colors active:bg-white/28">
                <MoodFace mood={m.value} size={30} />
              </span>
              <span className="text-caption-small text-white/90">{m.label}</span>
            </motion.button>
          ))}
        </div>
      </HeroFrame>
    );
  }

  const entries = symptomEntries(checkIn);

  return (
    <HeroFrame label="حال امروز">
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-white text-text-brand shadow-[0_8px_18px_-8px_rgb(30_27_51/0.45)]">
          <MoodFace mood={checkIn.mood} size={36} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-caption text-white/80">
            <Check size={14} strokeWidth={2.6} />
            امروز ثبت شد
          </p>
          <h2 className="font-display text-[22px] leading-snug font-bold">حالم {MOOD_LABEL[checkIn.mood]}ه</h2>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label="علائم امروز">
        {entries.length ? (
          entries.map((e) => (
            <li
              key={e.id}
              className="flex h-9 items-center gap-1.5 rounded-full bg-white/14 px-3.5 text-caption text-white"
            >
              {SYMPTOM_LABEL[e.id]}
              <span className="text-white/70">({SEVERITY_LABEL[e.severity]})</span>
            </li>
          ))
        ) : (
          <li className="flex h-9 items-center rounded-full bg-white/14 px-3.5 text-caption text-white">بدون علامت</li>
        )}
      </ul>
      {checkIn.note ? <p className="mt-3 text-body-small text-pretty text-white/85">«{checkIn.note}»</p> : null}

      <HeroActions>
        <HeroButton onClick={() => open()}>ویرایش حال امروز</HeroButton>
      </HeroActions>
    </HeroFrame>
  );
}
