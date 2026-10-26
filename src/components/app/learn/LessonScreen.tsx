"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { Screen } from "@/components/app/Screen";
import { Card } from "@/components/ui/Card";
import { AlertCircle, Check, ChevronBack, Lightbulb, Sparkles } from "@/components/ui/icons";
import { toFaDigits } from "@/lib/digits";
import { findLesson, LESSON_CATEGORIES, LESSON_PATH, type LessonBlock } from "@/lib/learn";
import { markRead, useLearn } from "@/lib/learn-store";

/**
 * One lesson, set for reading: comfortable body text, short lists, a tip and a warning where
 * they matter, and the takeaways at the end. Reaching the end marks it read. Then the next
 * lesson on the path, and the assistant for whatever the lesson didn't answer.
 */
export function LessonScreen({ id }: { id: string }) {
  const lesson = findLesson(id)!;
  const { read } = useLearn();
  const done = read.includes(id);
  const end = useRef<HTMLDivElement>(null);
  const category = LESSON_CATEGORIES.find((c) => c.value === lesson.category)!;
  const at = LESSON_PATH.indexOf(id);
  const next = findLesson(LESSON_PATH[(at + 1) % LESSON_PATH.length]);

  // Read once the takeaways are on screen.
  useEffect(() => {
    const el = end.current;
    if (!el || done) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && markRead(id), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [id, done]);

  return (
    <Screen pushed>
      <AppHeader title={lesson.title} caption={`${category.title}، ${toFaDigits(lesson.minutes)} دقیقه`} back />

      <article className="flex flex-col gap-4 px-5">
        <p className="text-body-small text-text-secondary">{lesson.summary}</p>
        {lesson.blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}

        <div ref={end}>
          <Card className="p-5">
            <h2 className="flex items-center justify-between text-title-section text-text-primary">
              خلاصه
              {done ? (
                <span className="flex items-center gap-1 text-caption text-text-brand">
                  <Check size={14} strokeWidth={3} />
                  خوندی
                </span>
              ) : null}
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {lesson.takeaways.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-body-small text-text-primary">
                  <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-brand text-text-on-brand">
                    <Check size={11} strokeWidth={3.5} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {lesson.link ? (
          <Link
            href={lesson.link.href}
            className="flex h-[52px] items-center justify-center gap-1.5 rounded-full bg-surface text-label-button text-text-brand shadow-card transition-transform active:scale-[0.97]"
          >
            {lesson.link.label}
            <ChevronBack size={18} />
          </Link>
        ) : null}

        <Link
          href={`/chat?q=${encodeURIComponent(lesson.ask)}`}
          className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-surface text-label-button text-text-brand shadow-card transition-transform active:scale-[0.97]"
        >
          <Sparkles size={18} />
          سؤال داری؟ از دستیار بپرس
        </Link>

        {next && next.id !== id ? (
          <Link
            href={`/learn/${next.id}`}
            className="mt-2 flex items-center gap-3.5 rounded-[22px] border border-violet-100 bg-surface p-4 transition-transform active:scale-[0.98]"
          >
            <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-brand-subtle text-[24px]">
              {next.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-caption text-text-brand">درس بعدی</span>
              <span className="block text-body-strong text-text-primary">{next.title}</span>
            </span>
            <ChevronBack size={20} className="shrink-0 text-text-tertiary" aria-hidden="true" />
          </Link>
        ) : null}

        <p className="text-center text-caption text-balance text-text-tertiary">
          آموزش عمومیه و جای صحبت با پزشکت رو نمی‌گیره.
        </p>
      </article>
    </Screen>
  );
}

function Block({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case "p":
      return <p className="text-body text-pretty text-text-primary">{block.text}</p>;
    case "h":
      return <h2 className="pt-2 text-title-section text-text-primary">{block.text}</h2>;
    case "list":
      return (
        <ul className="flex flex-col gap-2">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3 text-body text-pretty text-text-primary">
              <span aria-hidden="true" className="mt-[0.8em] size-1.5 shrink-0 rounded-full bg-violet-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "tip":
      return (
        <p className="flex items-start gap-3 rounded-[20px] bg-surface-brand-subtle px-4 py-3.5 text-body-small text-pretty text-text-primary">
          <Lightbulb size={18} className="mt-1 shrink-0 text-text-brand" />
          {block.text}
        </p>
      );
    case "warn":
      return (
        <p
          role="note"
          className="flex items-start gap-3 rounded-[20px] bg-danger-subtle px-4 py-3.5 text-body-small text-pretty text-text-primary"
        >
          <AlertCircle size={18} className="mt-1 shrink-0 text-danger" />
          {block.text}
        </p>
      );
  }
}
