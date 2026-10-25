"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { SeverityBars } from "./SeverityBars";
import { Card } from "@/components/ui/Card";
import { AlertCircle } from "@/components/ui/icons";
import { MoodFace } from "@/components/ui/MoodFace";
import type { CheckIn } from "@/lib/app-store";
import { symptomEntries } from "@/lib/stats";
import { MOOD_LABEL, MOODS, RED_FLAG_NOTE, RED_FLAG_SYMPTOMS, SYMPTOM_LABEL } from "@/lib/symptoms";

/**
 * Today's check-in on a card. Before it is done: «امروز حالت چطوره؟» and five faces, one tap
 * opens the check-in with that face chosen. After: the mood, the symptoms with their
 * severity, the note, and «ویرایش».
 */
export function CheckInCard({ checkIn, date }: { checkIn: CheckIn | undefined; date: string }) {
  const router = useRouter();
  const href = (extra = "") => `/check-in?date=${date}${extra}`;

  if (!checkIn) {
    return (
      <Card className="p-5">
        <h2 className="text-title-section text-text-primary">امروز حالت چطوره؟</h2>
        <p className="mt-0.5 text-caption text-text-secondary">یه لمس کافیه؛ بعدش اگه علامتی داری اضافه کن.</p>
        <div role="group" aria-label="حال امروز" className="mt-4 flex justify-between">
          {MOODS.map((m) => (
            <motion.button
              key={m.value}
              type="button"
              onClick={() => router.push(href(`&mood=${m.value}`))}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", bounce: 0, duration: 0.25 }}
              className="flex w-14 flex-col items-center gap-1.5"
            >
              <span className="grid size-[52px] place-items-center rounded-full bg-surface-brand-subtle text-violet-500 transition-colors active:bg-violet-100">
                <MoodFace mood={m.value} size={30} />
              </span>
              <span className="text-caption-small text-text-secondary">{m.label}</span>
            </motion.button>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <CheckInDetails
        checkIn={checkIn}
        edit={
          <Link href={href()} className="-me-2 flex h-11 items-center px-2 text-label text-text-brand">
            ویرایش
          </Link>
        }
      />
    </Card>
  );
}

/** Mood, symptoms, note: shared by the Today card and the day sheet. */
export function CheckInDetails({ checkIn, edit }: { checkIn: CheckIn; edit?: React.ReactNode }) {
  const entries = symptomEntries(checkIn);
  const redFlag = entries.some((e) => e.severity === 3 && RED_FLAG_SYMPTOMS.includes(e.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-text-on-brand">
          <MoodFace mood={checkIn.mood} size={28} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-caption text-text-secondary">حال کلی</p>
          <p className="text-body-strong text-text-primary">{MOOD_LABEL[checkIn.mood]}</p>
        </div>
        {edit}
      </div>

      <ul className="flex flex-wrap gap-2" aria-label="علائم">
        {entries.length ? (
          entries.map((e) => (
            <li
              key={e.id}
              className="flex h-9 items-center gap-2 rounded-full bg-surface-brand-subtle ps-3.5 pe-3 text-caption text-text-primary"
            >
              {SYMPTOM_LABEL[e.id]}
              <SeverityBars level={e.severity} />
            </li>
          ))
        ) : (
          <li className="flex h-9 items-center rounded-full bg-surface-brand-subtle px-3.5 text-caption text-text-secondary">
            بدون علامت
          </li>
        )}
      </ul>

      {checkIn.note ? <p className="text-body-small text-pretty text-text-secondary">«{checkIn.note}»</p> : null}

      {redFlag ? (
        <p
          role="note"
          className="flex items-start gap-2 rounded-[16px] bg-danger-subtle px-3.5 py-3 text-caption text-text-primary"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger" />
          {RED_FLAG_NOTE}
        </p>
      ) : null}
    </div>
  );
}
