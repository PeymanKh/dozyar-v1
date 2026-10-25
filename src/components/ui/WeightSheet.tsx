"use client";

import { useState } from "react";
import { BigNumber } from "./BigNumber";
import { Button } from "@/components/ui/Button";
import { Ruler } from "@/components/ui/Ruler";
import { Sheet } from "@/components/ui/Sheet";

/**
 * Picking a weight: the big readout over the ruler, in a sheet. Changes apply on «تأیید»;
 * closing the sheet keeps the previous value. `extra` adds a secondary action
 * (e.g. «یادم نیست» for the starting weight).
 */
export function WeightSheet({
  open,
  onClose,
  title,
  initial,
  onSave,
  extra,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initial: number;
  onSave: (kg: number) => void;
  extra?: React.ReactNode;
}) {
  const [kg, setKg] = useState<number | null>(null);
  const value = kg ?? initial;

  function close() {
    setKg(null);
    onClose();
  }

  return (
    <Sheet open={open} onClose={close} title={title}>
      <div className="flex flex-col gap-3">
        <BigNumber value={value} />
        <Ruler min={40} max={250} value={value} onChange={setKg} label={`${title} به کیلوگرم`} />
      </div>
      <div className="mt-6 flex flex-col gap-1">
        <Button
          onClick={() => {
            onSave(value);
            close();
          }}
        >
          تأیید
        </Button>
        {extra}
      </div>
    </Sheet>
  );
}
