"use client";

import Image from "next/image";
import { useState } from "react";
import { SITE_LABEL } from "@/components/app/BodyMap";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChevronBack, Clock, MapPin, PenInjector, Trash } from "@/components/ui/icons";
import { OptionGlyph } from "@/components/ui/OptionCard";
import { Sheet } from "@/components/ui/Sheet";
import { removeInjection, restoreInjection, useAppData, type InjectionLog } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { formatJalali, jalaliOf, MONTHS } from "@/lib/jalali";
import { formatMg, formatTime } from "@/lib/plan";
import { toast } from "@/lib/ui-store";
import penIcon from "../../../../public/onboarding/medication.png";

const PAGE = 8;

/** Every logged injection, newest first, grouped by Jalali month. Tapping one opens it. */
export function InjectionHistory() {
  const { injections } = useAppData();
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<InjectionLog | null>(null);

  if (!injections.length) {
    return (
      <Card className="flex items-center gap-4 p-5">
        <Image src={penIcon} alt="" width={56} height={56} className="size-14 shrink-0 object-contain" />
        <div>
          <p className="text-body-strong text-text-primary">هنوز تزریقی ثبت نشده</p>
          <p className="text-caption text-pretty text-text-secondary">
            بعد از هر تزریق ثبتش کن تا تاریخچه‌ات برای ویزیت آماده باشه.
          </p>
        </div>
      </Card>
    );
  }

  const newest = [...injections].reverse();
  const shown = all ? newest : newest.slice(0, PAGE);
  const groups: { key: string; title: string; items: InjectionLog[] }[] = [];
  for (const i of shown) {
    const j = jalaliOf(i.date);
    const key = `${j.jy}-${j.jm}`;
    if (groups.at(-1)?.key !== key) groups.push({ key, title: `${MONTHS[j.jm - 1]} ${toFaDigits(j.jy)}`, items: [] });
    groups.at(-1)!.items.push(i);
  }

  return (
    <>
      <Card className="overflow-hidden">
        {groups.map((g) => (
          <section key={g.key} aria-label={g.title}>
            <h3 className="bg-surface-brand-subtle/70 px-5 py-2 text-caption text-text-secondary">{g.title}</h3>
            <ul className="divide-y divide-violet-100">
              {g.items.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    className="flex min-h-16 w-full items-center gap-3 px-5 py-3 text-start transition-colors active:bg-surface-brand-subtle"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-body-strong text-text-primary">{formatJalali(i.date)}</span>
                      <span className="block text-caption text-text-secondary">ساعت {formatTime(i.time)}</span>
                    </span>
                    <span className="text-end">
                      <span className="block text-label text-text-primary">
                        {i.mg !== null ? `${formatMg(i.mg)} میلی‌گرم` : "—"}
                      </span>
                      <span className="block text-caption text-text-secondary">
                        {i.site ? SITE_LABEL[i.site] : "جا ثبت نشده"}
                      </span>
                    </span>
                    <ChevronBack size={18} className="shrink-0 text-text-tertiary" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Card>
      {newest.length > PAGE ? (
        <Button variant="plain" className="mt-1" onClick={() => setAll((a) => !a)}>
          {all ? "نمایش کمتر" : `نمایش همه (${toFaDigits(newest.length)})`}
        </Button>
      ) : null}

      <InjectionSheet log={open} onClose={() => setOpen(null)} />
    </>
  );
}

/** One injection: when, how much, where; and deleting it (with undo). */
function InjectionSheet({ log, onClose }: { log: InjectionLog | null; onClose: () => void }) {
  return (
    <Sheet open={log !== null} onClose={onClose} title={log ? formatJalali(log.date) : ""}>
      {log ? (
        <div className="flex flex-col gap-4">
          <Row icon={<Clock size={20} />} label="ساعت" value={formatTime(log.time)} />
          <Row
            icon={<PenInjector size={20} />}
            label="دوز"
            value={log.mg !== null ? `${formatMg(log.mg)} میلی‌گرم` : "نامشخص"}
          />
          <Row icon={<MapPin size={20} />} label="جای تزریق" value={log.site ? SITE_LABEL[log.site] : "ثبت نشده"} />
          <Button
            variant="plain"
            className="mt-2 !text-danger"
            onClick={() => {
              const removed = removeInjection(log.id);
              onClose();
              if (removed) toast("تزریق حذف شد", { label: "برگردون", run: () => restoreInjection(removed) });
            }}
          >
            <Trash size={18} />
            حذف این تزریق
          </Button>
        </div>
      ) : null}
    </Sheet>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <OptionGlyph>{icon}</OptionGlyph>
      <div>
        <p className="text-caption text-text-secondary">{label}</p>
        <p className="text-body-strong text-text-primary">{value}</p>
      </div>
    </div>
  );
}
