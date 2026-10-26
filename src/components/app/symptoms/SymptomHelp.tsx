"use client";

import Link from "next/link";
import { GuideEmoji } from "@/components/app/food/GuideGrid";
import { Card } from "@/components/ui/Card";
import { ChevronBack, Sparkles } from "@/components/ui/icons";
import type { CheckIn } from "@/lib/app-store";
import { guidesFor } from "@/lib/food-guide";
import { symptomEntries } from "@/lib/stats";

/**
 * Right after today's check-in, help for what was logged: the food guide for each symptom, and
 * the assistant with that question already asked. Nothing shows on a day without symptoms.
 */
export function SymptomHelp({ checkIn }: { checkIn: CheckIn | undefined }) {
  if (!checkIn) return null;
  const guides = guidesFor(symptomEntries(checkIn).map((e) => e.id));
  if (!guides.length) return null;

  return (
    <Card className="overflow-hidden">
      <p className="px-5 pt-4 text-caption text-text-secondary">برای علائم امروزت</p>
      <div className="divide-y divide-violet-100">
        {guides.map((g) => (
          <Link
            key={g.id}
            href={`/food/guide/${g.id}`}
            className="flex min-h-16 items-center gap-3.5 px-5 py-3 transition-colors active:bg-surface-brand-subtle"
          >
            <GuideEmoji guide={g} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block text-body-strong text-text-primary">{g.title}: چی بخورم؟</span>
              <span className="block truncate text-caption text-text-secondary">{g.short}</span>
            </span>
            <ChevronBack size={18} className="shrink-0 text-text-tertiary" aria-hidden="true" />
          </Link>
        ))}
        <Link
          href={`/chat?q=${encodeURIComponent(guides[0].ask)}`}
          className="flex h-14 items-center gap-2 px-5 text-label text-text-brand transition-colors active:bg-surface-brand-subtle"
        >
          <Sparkles size={17} />
          از دستیار بپرس
        </Link>
      </div>
    </Card>
  );
}
