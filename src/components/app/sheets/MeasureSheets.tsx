"use client";

import { useState } from "react";
import { DatePill } from "@/components/app/WhenPills";
import { BigNumber } from "@/components/ui/BigNumber";
import { Button } from "@/components/ui/Button";
import { Ruler } from "@/components/ui/Ruler";
import { Sheet } from "@/components/ui/Sheet";
import {
  logMeasurement,
  logWeight,
  removeMeasurement,
  removeWeight,
  restoreMeasurement,
  restoreWeight,
  useAppData,
} from "@/lib/app-store";
import { isoOf } from "@/lib/jalali";
import { useOnboarding } from "@/lib/onboarding-store";
import { formatKg } from "@/lib/plan";
import { haptic, toast } from "@/lib/ui-store";

/** «۰٫۴ کمتر از دفعه‌ی قبل» under the readout; nothing when there is no earlier value. */
function Delta({ value, previous, unit }: { value: number; previous: number | undefined; unit: string }) {
  if (previous === undefined) return <p className="h-5" />;
  const d = Math.round((value - previous) * 10) / 10;
  return (
    <p className="h-5 text-center text-caption text-text-secondary" aria-live="polite">
      {d === 0 ? "مثل دفعه‌ی قبل" : `${formatKg(Math.abs(d))} ${unit} ${d < 0 ? "کمتر" : "بیشتر"} از دفعه‌ی قبل`}
    </p>
  );
}

export function LogWeightSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="ثبت وزن">
      {open ? <WeightForm onDone={onClose} /> : null}
    </Sheet>
  );
}

function WeightForm({ onDone }: { onDone: () => void }) {
  const o = useOnboarding();
  const { weights } = useAppData();
  const [today] = useState(() => isoOf(new Date()));
  const [date, setDate] = useState(today);
  const [kg, setKg] = useState(() => weights.at(-1)?.kg ?? o.weight?.today ?? 80);
  const previous = weights.findLast((w) => w.date < date)?.kg;

  function save() {
    const replaced = weights.find((w) => w.date === date);
    const log = logWeight(date, kg);
    haptic(12);
    toast("وزن ثبت شد", {
      label: "برگردون",
      run: () => (replaced ? restoreWeight(replaced) : removeWeight(log.id)),
    });
    onDone();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <DatePill value={date} onChange={setDate} today={today} />
      </div>
      <div className="flex flex-col gap-1.5 pt-1">
        <BigNumber value={kg} />
        <Delta value={kg} previous={previous} unit="کیلو" />
      </div>
      <Ruler min={40} max={250} value={kg} onChange={setKg} label="وزن به کیلوگرم" />
      <Button className="mt-2" onClick={save}>
        ثبت وزن
      </Button>
    </div>
  );
}

export function WaistSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="دور کمر">
      {open ? <WaistForm onDone={onClose} /> : null}
    </Sheet>
  );
}

function WaistForm({ onDone }: { onDone: () => void }) {
  const { measurements } = useAppData();
  const [today] = useState(() => isoOf(new Date()));
  const [date, setDate] = useState(today);
  const [cm, setCm] = useState(() => measurements.at(-1)?.waistCm ?? 95);
  const previous = measurements.findLast((m) => m.date < date)?.waistCm;

  function save() {
    const replaced = measurements.find((m) => m.date === date);
    const log = logMeasurement(date, cm);
    haptic(12);
    toast("دور کمر ثبت شد", {
      label: "برگردون",
      run: () => (replaced ? restoreMeasurement(replaced) : removeMeasurement(log.id)),
    });
    onDone();
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="-mt-3 text-center text-caption text-text-secondary">متر رو دور کمر، هم‌سطح ناف بگیر</p>
      <div className="flex justify-center">
        <DatePill value={date} onChange={setDate} today={today} />
      </div>
      <div className="flex flex-col gap-1.5 pt-1">
        <BigNumber value={cm} unit="سانتی‌متر" />
        <Delta value={cm} previous={previous} unit="سانت" />
      </div>
      <Ruler min={40} max={200} step={0.5} value={cm} onChange={setCm} label="دور کمر به سانتی‌متر" />
      <Button className="mt-2" onClick={save}>
        ثبت دور کمر
      </Button>
    </div>
  );
}
