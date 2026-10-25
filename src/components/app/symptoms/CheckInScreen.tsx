"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StepScreen } from "@/components/onboarding/StepScreen";
import { Button } from "@/components/ui/Button";
import { AlertCircle, Check } from "@/components/ui/icons";
import { MoodFace } from "@/components/ui/MoodFace";
import { Segmented } from "@/components/ui/Segmented";
import { removeCheckIn, saveCheckIn, useAppData, type CheckIn } from "@/lib/app-store";
import { formatJalali } from "@/lib/jalali";
import {
  APPETITE_LABEL,
  MOODS,
  RED_FLAG_NOTE,
  RED_FLAG_SYMPTOMS,
  SYMPTOMS,
  type Appetite,
  type Mood,
  type SymptomId,
} from "@/lib/symptoms";
import { haptic, toast } from "@/lib/ui-store";
import { useToday } from "@/lib/use-now";
import journalIcon from "../../../../public/app/journal.png";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The daily check-in: how the day was overall (one tap), which symptoms and how strong,
 * appetite, and a note. Same frame and cards as onboarding. Opens for today, or for a past
 * day with ?date=; a face tapped on Today arrives as ?mood=.
 */
export function CheckInScreen() {
  const params = useSearchParams();
  const today = useToday();
  const { checkIns } = useAppData();
  if (!today) return null;

  const asked = params.get("date");
  const date = asked && ISO.test(asked) && asked <= today ? asked : today;
  const preset = Number(params.get("mood"));
  const existing = checkIns.find((c) => c.date === date);

  // A new date, a new face from Today, or a change saved elsewhere starts the form fresh
  // (this page stays mounted while hidden).
  return (
    <CheckInForm
      key={`${date}-${preset}-${existing ? JSON.stringify(existing) : ""}`}
      date={date}
      today={today}
      existing={existing}
      preset={preset >= 1 && preset <= 5 ? (preset as Mood) : null}
    />
  );
}

function CheckInForm({
  date,
  today,
  existing,
  preset,
}: {
  date: string;
  today: string;
  existing: CheckIn | undefined;
  preset: Mood | null;
}) {
  const router = useRouter();
  const [mood, setMood] = useState<Mood | null>(preset ?? existing?.mood ?? null);
  const [symptoms, setSymptoms] = useState<CheckIn["symptoms"]>(existing?.symptoms ?? {});
  const [appetite, setAppetite] = useState<Appetite | null>(existing?.appetite ?? null);
  const [note, setNote] = useState(existing?.note ?? "");
  const redFlag = RED_FLAG_SYMPTOMS.some((id) => symptoms[id] === 3);
  const isToday = date === today;

  function toggle(id: SymptomId) {
    setSymptoms((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  }

  function leave() {
    if (window.history.length > 1) router.back();
    else router.replace("/today");
  }

  function save() {
    if (!mood) return;
    saveCheckIn({
      date,
      mood,
      symptoms,
      ...(appetite ? { appetite } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    });
    haptic(12);
    toast(isToday ? "حال امروزت ثبت شد" : "ثبت شد");
    leave();
  }

  return (
    <StepScreen
      icon={journalIcon}
      title={isToday ? "امروز حالت چطوره؟" : "اون روز حالت چطور بود؟"}
      description={formatJalali(date)}
      action={
        <Button disabled={!mood} onClick={save}>
          {existing ? "ذخیره" : "ثبت"}
        </Button>
      }
    >
      <div className="flex flex-col gap-7 pb-4">
        <section aria-labelledby="mood-title" className="flex flex-col gap-3">
          <h2 id="mood-title" className="px-1 text-caption text-text-tertiary">
            حال کلی
          </h2>
          <div role="radiogroup" aria-labelledby="mood-title" className="flex justify-between">
            {MOODS.map((m) => {
              const selected = mood === m.value;
              return (
                <motion.button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMood(m.value)}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.25 }}
                  className="flex w-14 flex-col items-center gap-1.5"
                >
                  <span
                    className={`grid size-[54px] place-items-center rounded-full border transition-colors duration-200 ${
                      selected
                        ? "border-transparent bg-brand text-text-on-brand shadow-[0_8px_18px_-8px_rgb(110_75_245/0.8)]"
                        : "border-violet-200 bg-surface text-violet-500"
                    }`}
                  >
                    <MoodFace mood={m.value} size={30} />
                  </span>
                  <span className={`text-caption-small ${selected ? "text-text-brand" : "text-text-secondary"}`}>
                    {m.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="symptoms-title" className="flex flex-col gap-3">
          <div className="px-1">
            <h2 id="symptoms-title" className="text-caption text-text-tertiary">
              علائم
            </h2>
            <p className="text-caption-small text-text-tertiary">هر کدوم رو داری بزن، بعد بگو چقدر.</p>
          </div>
          {SYMPTOMS.map((s) => (
            <SymptomCard
              key={s.id}
              label={s.label}
              level={symptoms[s.id] ?? 0}
              onToggle={() => toggle(s.id)}
              onLevel={(level) => setSymptoms((prev) => ({ ...prev, [s.id]: level }))}
            />
          ))}
          <AnimatePresence initial={false}>
            {redFlag ? (
              <motion.p
                role="note"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 rounded-[16px] bg-danger-subtle px-3.5 py-3 text-caption text-text-primary"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger" />
                {RED_FLAG_NOTE}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </section>

        <section aria-labelledby="appetite-title" className="flex flex-col gap-3">
          <h2 id="appetite-title" className="px-1 text-caption text-text-tertiary">
            اشتها
          </h2>
          <Segmented<Appetite>
            label="اشتها"
            value={appetite}
            onChange={setAppetite}
            options={(["low", "normal", "high"] as Appetite[]).map((a) => ({ value: a, label: APPETITE_LABEL[a] }))}
          />
        </section>

        <section aria-labelledby="note-title" className="flex flex-col gap-3">
          <h2 id="note-title" className="px-1 text-caption text-text-tertiary">
            یادداشت (اختیاری)
          </h2>
          <textarea
            aria-labelledby="note-title"
            value={note}
            maxLength={280}
            rows={3}
            onChange={(e) => setNote(e.target.value)}
            placeholder="هر چیزی که می‌خوای یادت بمونه؛ مثلاً چی خوردی یا چقدر خوابیدی"
            className="w-full resize-none rounded-[18px] border border-violet-200 bg-surface px-4 py-3 text-[16px] leading-relaxed text-text-primary caret-brand outline-none transition-[border-color] duration-200 placeholder:text-text-tertiary/80 focus:border-border-focus"
          />
        </section>

        {existing ? (
          <Button
            variant="plain"
            className="!text-danger"
            onClick={() => {
              removeCheckIn(date);
              toast("ثبت این روز پاک شد", { label: "برگردون", run: () => saveCheckIn(existing) });
              leave();
            }}
          >
            پاک کردن ثبت این روز
          </Button>
        ) : null}
      </div>
    </StepScreen>
  );
}

const LEVELS: { value: "1" | "2" | "3"; label: string }[] = [
  { value: "1", label: "کم" },
  { value: "2", label: "متوسط" },
  { value: "3", label: "زیاد" },
];

/**
 * A symptom in the onboarding card style, as a checkbox. Once checked, it opens to ask how
 * strong (starting at «کم»), so the common case stays one tap.
 */
function SymptomCard({
  label,
  level,
  onToggle,
  onLevel,
}: {
  label: string;
  level: 0 | 1 | 2 | 3;
  onToggle: () => void;
  onLevel: (level: 1 | 2 | 3) => void;
}) {
  const on = level > 0;
  return (
    <div
      className={`rounded-[20px] border transition-[background-color,border-color] duration-200 ${
        on ? "border-border-focus bg-surface-brand-subtle" : "border-violet-200 bg-surface"
      }`}
    >
      <motion.button
        type="button"
        role="checkbox"
        aria-checked={on}
        onClick={onToggle}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="flex min-h-[60px] w-full items-center gap-3.5 px-4 py-3 text-start"
      >
        <span className="min-w-0 flex-1 text-body-strong text-text-primary">{label}</span>
        <span
          aria-hidden="true"
          className={`grid size-6 shrink-0 place-items-center rounded-[8px] border transition-colors duration-200 ${
            on ? "border-transparent bg-brand text-text-on-brand" : "border-violet-200"
          }`}
        >
          {on ? <Check size={14} strokeWidth={3} /> : null}
        </span>
      </motion.button>
      <AnimatePresence initial={false}>
        {on ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              <Segmented
                label={`شدت ${label}`}
                value={String(level) as "1" | "2" | "3"}
                onChange={(v) => onLevel(Number(v) as 1 | 2 | 3)}
                options={LEVELS}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
