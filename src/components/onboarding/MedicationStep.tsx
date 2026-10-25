"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { OptionCard, OptionGlyph } from "@/components/ui/OptionCard";
import { StepScreen } from "./StepScreen";
import { Button } from "@/components/ui/Button";
import { Hourglass, Plus } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { COUNTRY_NAME, MEDICATIONS, RHYTHM_GROUP, RHYTHM_LABEL, type Medication, type Rhythm } from "@/lib/medications";
import { progressFor } from "@/lib/onboarding-flow";
import { setOnboarding, useOnboarding, type MedicationChoice } from "@/lib/onboarding-store";
import medicationIcon from "../../../public/onboarding/medication.png";

const RHYTHMS: Rhythm[] = ["weekly", "daily"];

/**
 * Screen 3 (required). Same cards as screen 2, grouped under «تزریق هفتگی», «تزریق روزانه»
 * and «سایر» (the group says the rhythm, so cards don't repeat it): flag of the maker's
 * country, Persian name (English as printed on the pen beside it), generic. Iranian brands
 * first in each group. «سایر» holds a drug not on the list and "not chosen yet".
 * Choosing selects; «ادامه» saves and moves on, like every other step.
 */
export function MedicationStep() {
  const router = useRouter();
  const saved = useOnboarding().medication;
  const [choice, setChoice] = useState<MedicationChoice | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Coming back to this hidden page: the sheet is closed.
  useLayoutEffect(() => () => setSheetOpen(false), []);

  const current = choice ?? saved;
  const selected = current ? ("id" in current ? current.id : "pending" in current ? "pending" : "custom") : null;
  const custom = current && "customName" in current ? current : null;

  function next() {
    if (!current) return;
    if ("pending" in current) {
      // No drug yet: there is no dose to record; Today asks for both later.
      setOnboarding({ medication: current, dose: { unknown: true } });
      router.push("/onboarding/schedule");
      return;
    }
    setOnboarding({ medication: current });
    router.push("/onboarding/dose");
  }

  return (
    <StepScreen
      progress={progressFor(3)}
      backHref="/onboarding/journey"
      icon={medicationIcon}
      title="داروت چیه؟"
      description="اگه مطمئن نیستی، اسم روی قلم یا جعبه رو نگاه کن."
      action={
        <Button disabled={!current} onClick={next}>
          ادامه
        </Button>
      }
    >
      <div role="radiogroup" aria-label="داروت چیه؟" className="flex flex-col gap-6 pb-4">
        {RHYTHMS.map((rhythm) => (
          <section key={rhythm} aria-label={RHYTHM_GROUP[rhythm]} className="flex flex-col gap-3">
            <h2 className="px-1 text-caption text-text-tertiary">{RHYTHM_GROUP[rhythm]}</h2>
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

        <section aria-label="سایر" className="flex flex-col gap-3">
          <h2 className="px-1 text-caption text-text-tertiary">سایر</h2>
          <OptionCard
            icon={
              <OptionGlyph>
                <Plus size={20} />
              </OptionGlyph>
            }
            title={custom ? custom.customName : "داروم تو لیست نیست"}
            line={custom ? RHYTHM_LABEL[custom.rhythm] : "اسم و برنامه‌اش رو خودت می‌نویسی"}
            selected={selected === "custom"}
            onChoose={() => setSheetOpen(true)}
          />
          <OptionCard
            icon={
              <OptionGlyph>
                <Hourglass size={20} />
              </OptionGlyph>
            }
            title="هنوز داروم مشخص نیست"
            line="پزشکم هنوز انتخاب نکرده؛ بعداً اضافه‌اش می‌کنم"
            selected={selected === "pending"}
            onChoose={() => setChoice({ pending: true })}
          />
        </section>
      </div>

      <OtherMedicationSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={(customName, rhythm) => {
          setSheetOpen(false);
          setChoice({ customName, rhythm });
        }}
      />
    </StepScreen>
  );
}

/** "My drug isn't listed": a free-text name and how often it is injected. */
export function OtherMedicationSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, rhythm: Rhythm) => void;
}) {
  const [name, setName] = useState("");
  const [rhythm, setRhythm] = useState<Rhythm | null>(null);
  const ready = name.trim().length > 0 && rhythm !== null;

  return (
    <Sheet open={open} onClose={onClose} title="داروی دیگه">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) onSave(name.trim(), rhythm);
        }}
        className="flex flex-col"
      >
        <label className="mb-2 px-1 text-label text-text-secondary" htmlFor="other-medication">
          اسم دارو
        </label>
        <TextField
          id="other-medication"
          autoFocus
          enterKeyHint="done"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <span className="mt-5 mb-2 px-1 text-label text-text-secondary" id="other-rhythm">
          هر چند وقت یک‌بار؟
        </span>
        <div role="radiogroup" aria-labelledby="other-rhythm" className="grid grid-cols-2 gap-2.5">
          {(
            [
              ["weekly", "هر هفته یک‌بار"],
              ["daily", "هر روز"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rhythm === value}
              onClick={() => setRhythm(value)}
              className={`h-12 rounded-[16px] border text-label transition-[background-color,border-color,color] duration-150 ${
                rhythm === value
                  ? "border-border-focus bg-surface-brand-subtle text-text-brand"
                  : "border-violet-200 bg-surface text-text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <Button type="submit" disabled={!ready} className="mt-7">
          ذخیره
        </Button>
      </form>
    </Sheet>
  );
}

/** The maker's flag, round, for a drug card. */
export function DrugFlag({ medication, size = 40 }: { medication: Medication; size?: number }) {
  return (
    <Image
      src={`/flags/${medication.country}.svg`}
      alt={`ساخت ${COUNTRY_NAME[medication.country]}`}
      width={size}
      height={size}
      unoptimized
      className="rounded-full object-cover ring-1 ring-violet-200"
      style={{ width: size, height: size }}
    />
  );
}

/** Persian name with the English name (as printed on the pen) beside it. */
export function DrugName({ medication }: { medication: Medication }) {
  return (
    <>
      {medication.fa}{" "}
      <span dir="ltr" className="text-caption font-normal text-text-tertiary">
        {medication.en}
      </span>
    </>
  );
}
