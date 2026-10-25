"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BodyMap, SITE_LABEL } from "@/components/app/BodyMap";
import { DatePill, TimePill } from "@/components/app/WhenPills";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Info } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { logInjection, removeInjection, useAppData } from "@/lib/app-store";
import { isoOf } from "@/lib/jalali";
import { findMedication } from "@/lib/medications";
import { useOnboarding, type InjectionSite } from "@/lib/onboarding-store";
import { formatMg } from "@/lib/plan";
import { currentDoseMg, hasDrug, suggestSite } from "@/lib/treatment";
import { haptic, toast } from "@/lib/ui-store";

/**
 * Logging an injection: when (now by default), which dose (the current one is chosen), and
 * where (the suggested spot is chosen on the body). One tap on «ثبت» for the usual case.
 */
export function InjectionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="ثبت تزریق">
      {open ? <InjectionForm onDone={onClose} /> : null}
    </Sheet>
  );
}

function nowTime(now: Date) {
  const m = now.getMinutes() - (now.getMinutes() % 5);
  return `${String(now.getHours()).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function InjectionForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const o = useOnboarding();
  const { injections } = useAppData();
  const [now] = useState(() => new Date());
  const today = isoOf(now);
  const med = o.medication && "id" in o.medication ? findMedication(o.medication.id) : undefined;
  const current = currentDoseMg(o);
  const doses = [...new Set([...(med?.doses ?? []), ...(current !== null ? [current] : [])])].sort((a, b) => a - b);
  const suggested = suggestSite(injections);
  const last = injections.findLast((i) => i.site)?.site ?? null;

  const [date, setDate] = useState(today);
  const [time, setTime] = useState(() => nowTime(now));
  const [mg, setMg] = useState<number | null>(current);
  const [site, setSite] = useState<InjectionSite | null>(suggested);
  const sameDay = injections.some((i) => i.date === date);

  if (!hasDrug(o)) {
    return (
      <div className="flex flex-col gap-5 pb-1 text-center">
        <p className="text-body-small text-balance text-text-secondary">
          برای ثبت تزریق، اول داروت رو انتخاب کن. هر وقت پزشکت مشخص کرد، از صفحه‌ی درمان اضافه‌اش کن.
        </p>
        <Button
          onClick={() => {
            onDone();
            router.push("/treatment");
          }}
        >
          رفتن به درمان
        </Button>
      </div>
    );
  }

  function save() {
    const log = logInjection({ date, time, mg, site });
    haptic(12);
    toast("تزریق ثبت شد", { label: "برگردون", run: () => removeInjection(log.id) });
    onDone();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center gap-2">
        <DatePill value={date} onChange={setDate} today={today} />
        <TimePill value={time} onChange={setTime} />
      </div>

      {sameDay ? (
        <p className="-mt-2 flex items-start gap-2 rounded-[16px] bg-surface-brand-subtle px-3.5 py-3 text-caption text-text-secondary">
          <Info size={16} className="mt-0.5 shrink-0 text-text-brand" />
          برای این روز یه تزریق ثبت شده. اگه دوباره ثبت کنی، دوتا تزریق ثبت می‌شه.
        </p>
      ) : null}

      <section aria-labelledby="dose-label" className="flex flex-col gap-3">
        <h3 id="dose-label" className="text-center text-caption text-text-tertiary">
          دوز (میلی‌گرم)
        </h3>
        <div role="radiogroup" aria-labelledby="dose-label" className="flex flex-wrap justify-center gap-2">
          {doses.map((d) => (
            <Chip key={d} selected={mg === d} onClick={() => setMg(d)} className="min-w-14">
              {formatMg(d)}
            </Chip>
          ))}
          <Chip selected={mg === null} onClick={() => setMg(null)}>
            نمی‌دونم
          </Chip>
        </div>
      </section>

      <section aria-labelledby="site-label" className="flex flex-col gap-2">
        <h3 id="site-label" className="text-center text-caption text-text-tertiary">
          جای تزریق
          {site ? (
            <span className="text-text-brand">
              {" "}
              : {SITE_LABEL[site]}
              {site === suggested ? " (پیشنهاد)" : ""}
            </span>
          ) : null}
        </h3>
        <BodyMap value={site} onChange={setSite} suggested={suggested} last={last} height={262} />
      </section>

      <Button onClick={save}>ثبت تزریق</Button>
    </div>
  );
}
