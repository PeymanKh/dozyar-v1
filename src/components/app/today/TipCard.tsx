"use client";

import Image, { type StaticImageData } from "next/image";
import { Card } from "@/components/ui/Card";
import { useAppData } from "@/lib/app-store";
import { addDays, daysBetween } from "@/lib/jalali";
import { useOnboarding } from "@/lib/onboarding-store";
import { tipOfTheDay, type TipIcon } from "@/lib/tips";
import bowl from "../../../../public/app/bowl.png";
import droplet from "../../../../public/app/droplet.png";
import journal from "../../../../public/app/journal.png";
import medal from "../../../../public/app/medal.png";
import tape from "../../../../public/app/tape.png";

const ICONS: Record<TipIcon, StaticImageData> = { bowl, droplet, journal, medal, tape };

/** One everyday tip, chosen from the person's worries and the symptoms of the last few days. */
export function TipCard({ today }: { today: string }) {
  const { worries } = useOnboarding();
  const { checkIns } = useAppData();
  const since = addDays(today, -3);
  const recent = checkIns.filter((c) => c.date >= since).flatMap((c) => Object.keys(c.symptoms));
  const tip = tipOfTheDay(daysBetween("2025-03-21", today), [...recent, ...(worries ?? [])]);

  return (
    <Card className="flex items-center gap-4 p-4 pe-5">
      <div className="relative grid size-16 shrink-0 place-items-center">
        <div aria-hidden="true" className="halo absolute -inset-2" />
        <Image src={ICONS[tip.icon]} alt="" width={64} height={64} className="relative size-16 object-contain" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-caption text-text-brand">نکته‌ی امروز</p>
        <h2 className="text-body-strong text-text-primary">{tip.title}</h2>
        <p className="mt-0.5 text-caption text-pretty text-text-secondary">{tip.text}</p>
      </div>
    </Card>
  );
}
