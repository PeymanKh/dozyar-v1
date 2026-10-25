"use client";

import { useState } from "react";
import { DrugFlag, DrugName, OtherMedicationSheet } from "@/components/onboarding/MedicationStep";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Hourglass, Plus } from "@/components/ui/icons";
import { OptionCard, OptionGlyph } from "@/components/ui/OptionCard";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { toEnDigits } from "@/lib/digits";
import { findMedication, MEDICATIONS, RHYTHM_GROUP, RHYTHM_LABEL, type Rhythm } from "@/lib/medications";
import { setOnboarding, useOnboarding, type MedicationChoice } from "@/lib/onboarding-store";
import { formatMg } from "@/lib/plan";
import { currentDoseMg } from "@/lib/treatment";
import { toast } from "@/lib/ui-store";

const RHYTHMS: Rhythm[] = ["weekly", "daily"];

/**
 * Changing the drug (the doctor switched it, or it was not chosen during onboarding).
 * Same cards as onboarding; choosing selects, «ذخیره» saves. `onSaved` gets whether the
 * current dose still belongs to the new drug, so the dose can be asked next.
 */
export function ChangeMedicationSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (needsDose: boolean) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="داروت">
      {open ? <MedicationForm onSaved={onSaved} /> : null}
    </Sheet>
  );
}

function MedicationForm({ onSaved }: { onSaved: (needsDose: boolean) => void }) {
  const o = useOnboarding();
  const [choice, setChoice] = useState<MedicationChoice | null>(o.medication);
  const [otherOpen, setOtherOpen] = useState(false);
  const selected = choice ? ("id" in choice ? choice.id : "pending" in choice ? "pending" : "custom") : null;
  const custom = choice && "customName" in choice ? choice : null;

  function save() {
    if (!choice) return;
    const mg = currentDoseMg(o);
    const med = "id" in choice ? findMedication(choice.id) : undefined;
    const doseFits = mg !== null && (!med || med.doses.includes(mg));
    const sameDrug = JSON.stringify(choice) === JSON.stringify(o.medication);
    const needsDose = !("pending" in choice) && (!sameDrug || mg === null) && !doseFits;
    setOnboarding({ medication: choice, ...(needsDose || "pending" in choice ? { dose: { unknown: true } } : {}) });
    if (!sameDrug) toast("داروت به‌روز شد");
    onSaved(needsDose);
  }

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="داروت" className="flex flex-col gap-5">
        {RHYTHMS.map((rhythm) => (
          <section key={rhythm} aria-label={RHYTHM_GROUP[rhythm]} className="flex flex-col gap-2.5">
            <h3 className="px-1 text-caption text-text-tertiary">{RHYTHM_GROUP[rhythm]}</h3>
            {MEDICATIONS.filter((m) => m.rhythm === rhythm).map((m) => (
              <OptionCard
                key={m.id}
                icon={<DrugFlag medication={m} />}
                title={<DrugName medication={m} />}
                line={`ماده‌ی مؤثر: ${m.generic}`}
                selected={selected === m.id}
                onChoose={() => setChoice({ id: m.id })}
              />
            ))}
          </section>
        ))}
        <section aria-label="سایر" className="flex flex-col gap-2.5">
          <h3 className="px-1 text-caption text-text-tertiary">سایر</h3>
          <OptionCard
            icon={
              <OptionGlyph>
                <Plus size={20} />
              </OptionGlyph>
            }
            title={custom ? custom.customName : "داروم تو لیست نیست"}
            line={custom ? RHYTHM_LABEL[custom.rhythm] : "اسم و برنامه‌اش رو خودت می‌نویسی"}
            selected={selected === "custom"}
            onChoose={() => setOtherOpen(true)}
          />
          <OptionCard
            icon={
              <OptionGlyph>
                <Hourglass size={20} />
              </OptionGlyph>
            }
            title="هنوز داروم مشخص نیست"
            line="پزشکم هنوز انتخاب نکرده"
            selected={selected === "pending"}
            onChoose={() => setChoice({ pending: true })}
          />
        </section>
      </div>

      <div className="sticky bottom-0 -mx-6 bg-linear-to-t from-surface from-70% to-surface/0 px-6 pt-4">
        <Button disabled={!choice} onClick={save}>
          ذخیره
        </Button>
      </div>

      <OtherMedicationSheet
        open={otherOpen}
        onClose={() => setOtherOpen(false)}
        onSave={(customName, rhythm) => {
          setOtherOpen(false);
          setChoice({ customName, rhythm });
        }}
      />
    </div>
  );
}

/**
 * Recording a new dose the doctor prescribed. The app never suggests one: the person picks
 * what is on their prescription, or types it.
 */
export function DoseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="دوز فعلیت">
      {open ? <DoseForm onDone={onClose} /> : null}
    </Sheet>
  );
}

function DoseForm({ onDone }: { onDone: () => void }) {
  const o = useOnboarding();
  const med = o.medication && "id" in o.medication ? findMedication(o.medication.id) : undefined;
  const current = currentDoseMg(o);
  const [mg, setMg] = useState<number | null>(current);
  const [other, setOther] = useState(current !== null && med && !med.doses.includes(current) ? String(current) : "");
  const [typing, setTyping] = useState(!med || (current !== null && !med.doses.includes(current)));
  const typed = Number(
    toEnDigits(other)
      .replace("٫", ".")
      .replace(/[^0-9.]/g, ""),
  );
  const value = typing ? (typed > 0 && typed < 100 ? typed : null) : mg;

  function save() {
    if (value === null) return;
    setOnboarding({ dose: { mg: value } });
    toast(value === current ? "دوزت ثبت شد" : `دوز جدید: ${formatMg(value)} میلی‌گرم`);
    onDone();
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="-mt-3 text-center text-caption text-balance text-text-secondary">
        همون دوزی که پزشکت تجویز کرده. از تزریق بعدی با این دوز ثبت می‌شه.
      </p>
      {med ? (
        <div role="radiogroup" aria-label="دوز به میلی‌گرم" className="flex flex-wrap justify-center gap-2">
          {med.doses.map((d) => (
            <Chip
              key={d}
              selected={!typing && mg === d}
              onClick={() => {
                setTyping(false);
                setMg(d);
              }}
              className="min-w-16"
            >
              {formatMg(d)}
            </Chip>
          ))}
          <Chip selected={typing} onClick={() => setTyping(true)}>
            دوز دیگه
          </Chip>
        </div>
      ) : null}
      {typing ? (
        <label className="flex flex-col gap-2">
          <span className="px-1 text-label text-text-secondary">دوز به میلی‌گرم</span>
          <TextField
            inputMode="decimal"
            autoFocus={!!med}
            dir="ltr"
            className="text-center"
            placeholder="مثلاً ۰٫۵"
            value={other}
            onChange={(e) => setOther(e.target.value.replace(/[^0-9۰-۹٠-٩.٫]/g, "").slice(0, 6))}
          />
        </label>
      ) : null}
      <p className="text-center text-caption text-text-secondary" aria-live="polite">
        {value !== null ? `${formatMg(value)} میلی‌گرم` : " "}
      </p>
      <Button disabled={value === null} onClick={save}>
        ذخیره
      </Button>
    </div>
  );
}
