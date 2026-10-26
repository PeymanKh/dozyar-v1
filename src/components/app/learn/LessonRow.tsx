"use client";

import Link from "next/link";
import { Check, ChevronBack } from "@/components/ui/icons";
import { toFaDigits } from "@/lib/digits";
import type { Lesson } from "@/lib/learn";
import { useLearn } from "@/lib/learn-store";

/** A lesson in a list: its emoji, title and line, how long it takes, and a check once read. */
export function LessonRow({ lesson }: { lesson: Lesson }) {
  const { read } = useLearn();
  const done = read.includes(lesson.id);
  return (
    <Link
      href={`/learn/${lesson.id}`}
      className="flex min-h-[72px] w-full items-center gap-3.5 px-4 py-3 text-start transition-colors active:bg-surface-brand-subtle"
    >
      <span
        aria-hidden="true"
        className="relative grid size-11 shrink-0 place-items-center rounded-full bg-linear-to-br from-violet-50 to-violet-100 text-[22px]"
      >
        {lesson.emoji}
        {done ? (
          <span className="absolute -end-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full border-2 border-surface bg-brand text-text-on-brand">
            <Check size={10} strokeWidth={3.5} />
          </span>
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-strong text-text-primary">{lesson.title}</span>
        <span className="block truncate text-caption text-text-secondary">
          {done ? "خوندی، " : ""}
          {toFaDigits(lesson.minutes)} دقیقه، {lesson.summary}
        </span>
      </span>
      <ChevronBack size={18} className="shrink-0 text-text-tertiary" aria-hidden="true" />
    </Link>
  );
}
