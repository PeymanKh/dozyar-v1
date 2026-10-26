"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ArrowUp, Sparkles } from "@/components/ui/icons";
import { useAppData } from "@/lib/app-store";
import { buildContext, suggestions } from "@/lib/assistant";
import { useOnboarding } from "@/lib/onboarding-store";

/**
 * The assistant on Today: two questions that fit the person right now (after nausea, food for
 * nausea; when a dose is late, what to do), and a field-like bar that opens the conversation.
 */
export function AssistantCard({ now }: { now: Date }) {
  const o = useOnboarding();
  const data = useAppData();
  const asks = suggestions(buildContext(o, data, now)).slice(0, 2);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-white shadow-[0_6px_14px_-6px_rgb(110_75_245/0.7)]"
        >
          <Sparkles size={19} />
        </span>
        <div className="min-w-0">
          <h2 className="text-title-section text-text-primary">سؤالی داری؟</h2>
          <p className="text-caption text-text-secondary">درباره‌ی دارو، عوارض و تغذیه از دستیار بپرس</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {asks.map((q) => (
          <Link
            key={q}
            href={`/chat?q=${encodeURIComponent(q)}`}
            className="flex min-h-10 items-center rounded-full bg-surface-brand-subtle px-4 py-2 text-caption text-text-brand transition-colors active:bg-violet-100"
          >
            {q}
          </Link>
        ))}
      </div>

      <Link
        href="/chat"
        className="mt-3 flex h-12 items-center gap-2 rounded-full border border-violet-200 bg-surface ps-4 pe-1.5 transition-colors active:bg-surface-brand-subtle"
      >
        <span className="flex-1 text-body-small text-text-tertiary">سؤالت رو بنویس…</span>
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-violet-200 text-white">
          <ArrowUp size={18} strokeWidth={2.4} />
        </span>
      </Link>
    </Card>
  );
}
