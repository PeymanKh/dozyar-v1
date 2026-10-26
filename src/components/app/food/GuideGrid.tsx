"use client";

import Link from "next/link";
import { useAppData } from "@/lib/app-store";
import { addDays } from "@/lib/jalali";
import { GUIDES, guidesFor, type FoodGuide } from "@/lib/food-guide";
import type { SymptomId } from "@/lib/symptoms";
import { ChevronBack } from "@/components/ui/icons";

/** Symptoms logged today or yesterday. */
export function useRecentSymptoms(today: string): SymptomId[] {
  const { checkIns } = useAppData();
  const since = addDays(today, -1);
  return [...new Set(checkIns.filter((c) => c.date >= since).flatMap((c) => Object.keys(c.symptoms) as SymptomId[]))];
}

/**
 * «چی بخوری» for each common side effect, as a grid of small cards. When today's or
 * yesterday's check-in has one of them, its guide comes first as a wide card: the food
 * advice meets the person where they are.
 */
export function GuideGrid({ today }: { today: string }) {
  const recent = useRecentSymptoms(today);
  const forYou = guidesFor(recent);
  const rest = GUIDES.filter((g) => !forYou.includes(g));

  return (
    <div className="flex flex-col gap-3">
      {forYou.map((g) => (
        <Link
          key={g.id}
          href={`/food/guide/${g.id}`}
          className="flex items-center gap-3.5 rounded-[22px] border border-border-focus bg-surface-brand-subtle p-4 transition-transform active:scale-[0.98]"
        >
          <GuideEmoji guide={g} size={52} />
          <span className="min-w-0 flex-1">
            <span className="block text-caption text-text-brand">برای حال این روزهات</span>
            <span className="block text-body-strong text-text-primary">{g.title}: چی بخورم؟</span>
            <span className="block text-caption text-text-secondary">{g.short}</span>
          </span>
          <ChevronBack size={20} className="shrink-0 text-text-tertiary" aria-hidden="true" />
        </Link>
      ))}
      <div className="grid grid-cols-2 gap-3">
        {rest.map((g) => (
          <Link
            key={g.id}
            href={`/food/guide/${g.id}`}
            className="flex min-h-[124px] flex-col gap-2 rounded-[22px] border border-violet-100 bg-surface p-4 shadow-[0_1px_2px_rgb(30_27_51/0.03),0_10px_28px_-14px_rgb(110_75_245/0.16)] transition-transform active:scale-[0.97]"
          >
            <GuideEmoji guide={g} size={40} />
            <span className="text-body-strong text-text-primary">{g.title}</span>
            <span className="line-clamp-2 text-caption-small text-text-secondary">{g.short}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function GuideEmoji({ guide, size }: { guide: FoodGuide; size: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full bg-linear-to-br from-violet-50 to-violet-100"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
    >
      {guide.emoji}
    </span>
  );
}
