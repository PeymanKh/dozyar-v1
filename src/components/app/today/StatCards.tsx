"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Sparkline } from "@/components/app/Sparkline";
import { Plus } from "@/components/ui/icons";
import { useAppData } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { daysBetween, formatJalali } from "@/lib/jalali";
import { useOnboarding } from "@/lib/onboarding-store";
import { formatKg } from "@/lib/plan";
import { weightSummary } from "@/lib/stats";
import { treatmentStart } from "@/lib/treatment";
import { openSheet } from "@/lib/ui-store";

const tile =
  "relative flex min-h-[156px] flex-col rounded-[24px] border border-violet-100 bg-surface p-4 shadow-[0_1px_2px_rgb(30_27_51/0.03),0_10px_28px_-14px_rgb(110_75_245/0.16)] transition-transform active:scale-[0.98]";

/** Current weight, the change since the start, and the trend. «+» logs a new weight. */
export function WeightTile() {
  const o = useOnboarding();
  const { weights } = useAppData();
  const summary = weightSummary(o, weights);
  if (!summary) return null;
  const { current, lost } = summary;

  return (
    <div className="relative">
      <Link href="/progress" className={tile} aria-label={`وزن ${formatKg(current)} کیلوگرم. دیدن پیشرفت`}>
        <span className="text-caption text-text-secondary">وزن</span>
        <span className="mt-1 flex items-baseline gap-1">
          <span className="font-display text-[28px] leading-tight font-bold text-text-primary">
            {formatKg(current)}
          </span>
          <span className="text-caption text-text-secondary">کیلو</span>
        </span>
        <span className={`text-caption ${lost > 0 ? "text-text-brand" : "text-text-tertiary"}`}>
          {lost > 0 ? `${formatKg(lost)} کیلو کمتر از شروع` : "نقطه‌ی شروعت"}
        </span>
        <span className="mt-auto pt-2">
          <Sparkline values={weights.slice(-12).map((w) => w.kg)} height={30} />
        </span>
      </Link>
      <motion.button
        type="button"
        aria-label="ثبت وزن"
        onClick={() => openSheet("weight")}
        whileTap={{ scale: 0.9 }}
        className="absolute top-2.5 left-2.5 grid size-10 place-items-center rounded-full bg-surface-brand-subtle text-text-brand"
      >
        <Plus size={18} strokeWidth={2.4} />
      </motion.button>
    </div>
  );
}

/** How long the treatment has been going, and how many injections are logged. */
export function TreatmentTile({ today }: { today: string }) {
  const o = useOnboarding();
  const { injections } = useAppData();
  const start = treatmentStart(o, injections);
  const started = start !== null && start <= today;
  const days = started ? daysBetween(start, today) + 1 : 0;

  return (
    <Link href="/treatment" className={tile}>
      <span className="text-caption text-text-secondary">{started ? "از شروع درمان" : "شروع درمان"}</span>
      {started ? (
        <span className="mt-1 flex items-baseline gap-1">
          <span className="font-display text-[28px] leading-tight font-bold text-text-primary">{toFaDigits(days)}</span>
          <span className="text-caption text-text-secondary">روز</span>
        </span>
      ) : (
        <span className="mt-1 font-display text-[20px] leading-tight font-bold text-text-primary">
          {start ? formatJalali(start, false) : "به‌زودی"}
        </span>
      )}
      <span className="text-caption text-text-secondary">
        {injections.length ? `${toFaDigits(injections.length)} تزریق ثبت شده` : "هنوز تزریقی ثبت نشده"}
      </span>
      {/* One dot per logged injection, the last eight */}
      <span className="mt-auto flex flex-wrap gap-1 pt-3" aria-hidden="true">
        {Array.from({ length: Math.min(8, Math.max(injections.length, 1)) }, (_, i) => (
          <span
            key={i}
            className={`size-2.5 rounded-full ${i < injections.length ? "bg-brand" : "border border-dashed border-violet-300"}`}
            style={{ opacity: i < injections.length ? 0.45 + (0.55 * (i + 1)) / Math.min(8, injections.length) : 1 }}
          />
        ))}
      </span>
    </Link>
  );
}
