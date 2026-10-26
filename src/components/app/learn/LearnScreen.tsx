"use client";

import Link from "next/link";
import { LessonRow } from "./LessonRow";
import { AppHeader } from "@/components/app/AppHeader";
import { Meter } from "@/components/app/Meter";
import { Screen } from "@/components/app/Screen";
import { Card } from "@/components/ui/Card";
import { ChevronBack } from "@/components/ui/icons";
import { toFaDigits } from "@/lib/digits";
import { LESSON_CATEGORIES, LESSON_PATH, lessonsIn, nextLesson } from "@/lib/learn";
import { useLearn } from "@/lib/learn-store";

/**
 * Lessons, as a path: how far along, the next one to read, then every lesson by topic. Short
 * on purpose (two to four minutes), so one fits between two things.
 */
export function LearnScreen() {
  const { read } = useLearn();
  const done = LESSON_PATH.filter((id) => read.includes(id)).length;
  const next = nextLesson(read);

  return (
    <Screen pushed>
      <AppHeader title="یادگیری" caption="کوتاه و کاربردی، درباره‌ی درمانت" back />

      <div className="flex flex-col gap-4 px-4">
        <Card className="p-5">
          <Meter
            value={done}
            target={LESSON_PATH.length}
            label="مسیر یادگیری"
            valueLabel={`${toFaDigits(done)} از ${toFaDigits(LESSON_PATH.length)} درس`}
          />
          {next ? (
            <Link
              href={`/learn/${next.id}`}
              className="mt-4 flex items-center gap-3.5 rounded-[18px] bg-surface-brand-subtle p-3.5 transition-transform active:scale-[0.98]"
            >
              <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-[24px]">
                {next.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-caption text-text-brand">{done ? "ادامه بده" : "از اینجا شروع کن"}</span>
                <span className="block text-body-strong text-text-primary">{next.title}</span>
                <span className="block text-caption text-text-secondary">{toFaDigits(next.minutes)} دقیقه</span>
              </span>
              <ChevronBack size={20} className="shrink-0 text-text-tertiary" aria-hidden="true" />
            </Link>
          ) : (
            <p className="mt-3 text-body-small text-text-primary">همه‌ی درس‌ها رو خوندی. آفرین! هر وقت خواستی دوباره سر بزن.</p>
          )}
        </Card>

        {LESSON_CATEGORIES.map((c) => (
          <section key={c.value} aria-labelledby={`cat-${c.value}`} className="pt-2">
            <div className="px-1 pb-2.5">
              <h2 id={`cat-${c.value}`} className="text-title-section text-text-primary">
                {c.title}
              </h2>
              <p className="text-caption text-text-secondary">{c.line}</p>
            </div>
            <Card className="divide-y divide-violet-100 overflow-hidden">
              {lessonsIn(c.value).map((l) => (
                <LessonRow key={l.id} lesson={l} />
              ))}
            </Card>
          </section>
        ))}

        <p className="px-4 text-center text-caption text-balance text-text-tertiary">
          این درس‌ها آموزش عمومی‌ان و جای صحبت با پزشکت رو نمی‌گیرن.
        </p>
      </div>
    </Screen>
  );
}
