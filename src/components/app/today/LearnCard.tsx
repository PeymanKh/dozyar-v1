"use client";

import Link from "next/link";
import { Meter } from "@/components/app/Meter";
import { Card } from "@/components/ui/Card";
import { ChevronBack } from "@/components/ui/icons";
import { toFaDigits } from "@/lib/digits";
import { LESSON_PATH, nextLesson } from "@/lib/learn";
import { useLearn } from "@/lib/learn-store";

/** The next lesson on the path, with how far along the path is; «همه» opens the library. */
export function LearnCard() {
  const { read } = useLearn();
  const next = nextLesson(read);
  const done = LESSON_PATH.filter((id) => read.includes(id)).length;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-title-section text-text-primary">یادگیری</h2>
        <Link href="/learn" className="-me-2 flex h-11 items-center gap-0.5 px-2 text-label text-text-brand">
          همه
          <ChevronBack size={16} />
        </Link>
      </div>
      {next ? (
        <Link
          href={`/learn/${next.id}`}
          className="mt-2 flex items-center gap-3.5 rounded-[18px] bg-surface-brand-subtle p-3.5 transition-transform active:scale-[0.98]"
        >
          <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-[24px]">
            {next.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-caption text-text-brand">
              {done ? "درس بعدی" : "اولین درس"}، {toFaDigits(next.minutes)} دقیقه
            </span>
            <span className="block text-body-strong text-text-primary">{next.title}</span>
          </span>
          <ChevronBack size={20} className="shrink-0 text-text-tertiary" aria-hidden="true" />
        </Link>
      ) : (
        <p className="mt-1 text-body-small text-text-secondary">همه‌ی درس‌ها رو خوندی. آفرین!</p>
      )}
      <div className="mt-4">
        <Meter
          value={done}
          target={LESSON_PATH.length}
          label="مسیرت"
          valueLabel={`${toFaDigits(done)} از ${toFaDigits(LESSON_PATH.length)} درس`}
          height={6}
        />
      </div>
    </Card>
  );
}
