"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { JalaliCalendar } from "@/components/ui/JalaliCalendar";
import { Sheet } from "@/components/ui/Sheet";
import { WheelPicker } from "@/components/ui/WheelPicker";
import { toFaDigits } from "@/lib/digits";
import { jalaliOf, MONTHS } from "@/lib/jalali";
import type { InjectionSite } from "@/lib/onboarding-store";
import { SITES } from "@/lib/plan";

/** A Jalali calendar in a sheet; picking a day closes it. */
export function DateSheet({
  open,
  onClose,
  title,
  value,
  onChange,
  min,
  max,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  value: string | undefined;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <JalaliCalendar
        value={value ?? null}
        min={min}
        max={max}
        onChange={(iso) => {
          onChange(iso);
          onClose();
        }}
      />
    </Sheet>
  );
}

const HOURS = Array.from({ length: 24 }, (_, h) => ({ value: h, label: toFaDigits(String(h).padStart(2, "0")) }));
const MINUTES = Array.from({ length: 12 }, (_, i) => ({
  value: i * 5,
  label: toFaDigits(String(i * 5).padStart(2, "0")),
}));

/** Hour and minute wheels (5-minute steps) in a sheet. */
export function TimeSheet({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: string | undefined;
  onChange: (time: string) => void;
}) {
  const [h, m] = (value ?? "20:00").split(":").map(Number);
  const [hour, setHour] = useState<number | null>(null);
  const [minute, setMinute] = useState<number | null>(null);

  return (
    <Sheet open={open} onClose={onClose} title="چه ساعتی؟">
      <div className="flex items-center justify-center gap-3" dir="ltr">
        <WheelPicker items={HOURS} value={hour ?? h} onChange={setHour} label="ساعت" className="w-24" />
        <span className="text-title-screen text-text-tertiary">:</span>
        <WheelPicker
          items={MINUTES}
          value={minute ?? m - (m % 5)}
          onChange={setMinute}
          label="دقیقه"
          className="w-24"
        />
      </div>
      <Button
        className="mt-6"
        onClick={() => {
          const hh = hour ?? h;
          const mm = minute ?? m - (m % 5);
          onChange(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
          onClose();
        }}
      >
        تأیید
      </Button>
    </Sheet>
  );
}

/** Approximate month and year, never in the future. */
export function MonthSheet({
  open,
  onClose,
  today,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  today: string;
  value: { jy: number; jm: number } | undefined;
  onChange: (value: { jy: number; jm: number }) => void;
}) {
  const now = jalaliOf(today);
  const [jm, setJm] = useState<number | null>(null);
  const [jy, setJy] = useState<number | null>(null);
  const years = Array.from({ length: 6 }, (_, i) => ({ value: now.jy - 5 + i, label: toFaDigits(now.jy - 5 + i) }));
  const months = MONTHS.map((name, i) => ({ value: i + 1, label: name }));
  const year = jy ?? value?.jy ?? now.jy;
  const month = jm ?? value?.jm ?? now.jm;

  return (
    <Sheet open={open} onClose={onClose} title="از کی شروع کردی؟">
      <p className="-mt-3 mb-4 text-center text-caption text-text-tertiary">تقریبی هم کافیه</p>
      <div className="flex items-center justify-center gap-3">
        <WheelPicker items={months} value={month} onChange={setJm} label="ماه" className="w-32" />
        <WheelPicker items={years} value={year} onChange={setJy} label="سال" className="w-24" />
      </div>
      <Button
        className="mt-6"
        onClick={() => {
          // Never in the future.
          onChange({ jy: year, jm: year === now.jy && month > now.jm ? now.jm : month });
          onClose();
        }}
      >
        تأیید
      </Button>
    </Sheet>
  );
}

/** Where the last injection went; picking closes the sheet. */
export function SiteSheet({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: InjectionSite | null | undefined;
  onChange: (site: InjectionSite | null) => void;
}) {
  const pick = (site: InjectionSite | null) => {
    onChange(site);
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="کجا تزریق کردی؟">
      <p className="-mt-3 mb-4 text-center text-caption text-text-tertiary">
        برای اینکه دفعه‌ی بعد جای دیگه‌ای رو پیشنهاد بدیم
      </p>
      <div role="radiogroup" aria-label="جای آخرین تزریق" className="grid grid-cols-2 gap-2">
        {SITES.map((s) => (
          <Chip key={s.value} selected={value === s.value} onClick={() => pick(s.value)}>
            {s.label}
          </Chip>
        ))}
        <Chip selected={value === null} onClick={() => pick(null)} className="col-span-2">
          یادم نیست
        </Chip>
      </div>
    </Sheet>
  );
}
