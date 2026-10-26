"use client";

import Image from "next/image";
import { useState } from "react";
import { DoseStairs } from "./DoseStairs";
import { InjectionHistory } from "./InjectionHistory";
import { ChangeMedicationSheet, DoseSheet } from "./TreatmentSheets";
import { AppHeader } from "@/components/app/AppHeader";
import { BodyMap, SITE_LABEL } from "@/components/app/BodyMap";
import { LessonRow } from "@/components/app/learn/LessonRow";
import { Screen } from "@/components/app/Screen";
import { DrugFlag, DrugName } from "@/components/onboarding/MedicationStep";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Pencil, PenInjector, ShieldCheck } from "@/components/ui/icons";
import { OptionGlyph } from "@/components/ui/OptionCard";
import { TimeSheet } from "@/components/ui/PickerSheets";
import { useAppData } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { daysBetween, formatJalali, isoOf, WEEKDAYS, weekdayOf } from "@/lib/jalali";
import { findLesson } from "@/lib/learn";
import { findMedication, RHYTHM_GROUP } from "@/lib/medications";
import { setOnboarding, useOnboarding } from "@/lib/onboarding-store";
import { formatMg, formatTime, medicationName, rhythmOf } from "@/lib/plan";
import {
  currentDoseMg,
  doseState,
  doseSteps,
  hasDrug,
  recentSiteUse,
  suggestSite,
  treatmentStart,
} from "@/lib/treatment";
import { openSheet, toast } from "@/lib/ui-store";
import { useNow } from "@/lib/use-now";
import penIcon from "../../../../public/onboarding/medication.png";

type TreatmentSheet = "drug" | "dose" | "time" | null;

/**
 * The treatment: which drug and dose (recorded, never suggested), when it is injected,
 * where the next injection could go, how the dose has stepped up, every injection, and the
 * lessons about the medicine itself.
 */
export function TreatmentScreen() {
  const now = useNow();
  const o = useOnboarding();
  const { injections } = useAppData();
  const [sheet, setSheet] = useState<TreatmentSheet>(null);
  if (!now) return null;

  const today = isoOf(now);
  const rhythm = rhythmOf(o.medication);
  const steps = doseSteps(injections);

  return (
    <Screen>
      <AppHeader title="درمان" caption={hasDrug(o) ? RHYTHM_GROUP[rhythm] : "داروت"} />

      <div className="flex flex-col gap-4 px-4">
        <DrugCard today={today} now={now} onEdit={setSheet} />

        {hasDrug(o) ? (
          <>
            <div className="pt-2">
              <SectionTitle>جای تزریق</SectionTitle>
              <SiteCard />
            </div>
            <Button onClick={() => openSheet("injection")}>ثبت تزریق</Button>
          </>
        ) : null}

        {steps.length > 1 || (steps.length === 1 && steps[0].mg !== null) ? (
          <div className="pt-2">
            <SectionTitle>تاریخچه‌ی دوز</SectionTitle>
            <Card className="p-5">
              <DoseStairs steps={steps} />
            </Card>
          </div>
        ) : null}

        <div className="pt-2">
          <SectionTitle>تاریخچه‌ی تزریق</SectionTitle>
          <InjectionHistory />
        </div>

        <div className="pt-2">
          <SectionTitle href="/learn">یادگیری درباره‌ی درمان</SectionTitle>
          <Card className="divide-y divide-violet-100 overflow-hidden">
            {["how-it-works", "injection-basics", "storage"].map((id) => (
              <LessonRow key={id} lesson={findLesson(id)!} />
            ))}
          </Card>
        </div>
      </div>

      <ChangeMedicationSheet
        open={sheet === "drug"}
        onClose={() => setSheet(null)}
        onSaved={(needsDose) => setSheet(needsDose ? "dose" : null)}
      />
      <DoseSheet open={sheet === "dose"} onClose={() => setSheet(null)} />
      <TimeSheet
        open={sheet === "time"}
        onClose={() => setSheet(null)}
        value={o.schedule?.time}
        onChange={(time) => {
          if (!o.schedule) return;
          setOnboarding({ schedule: { ...o.schedule, time } });
          toast(`ساعت تزریق: ${formatTime(time)}`);
        }}
      />
    </Screen>
  );
}

function DrugCard({ today, now, onEdit }: { today: string; now: Date; onEdit: (sheet: TreatmentSheet) => void }) {
  const o = useOnboarding();
  const { injections } = useAppData();

  if (!hasDrug(o)) {
    return (
      <Card className="flex flex-col items-center p-6 text-center">
        <div className="relative mb-3 grid size-24 place-items-center">
          <div aria-hidden="true" className="halo absolute -inset-4" />
          <Image src={penIcon} alt="" width={88} height={88} className="relative size-22 object-contain" />
        </div>
        <h2 className="text-title-section text-text-primary">هنوز داروت مشخص نیست</h2>
        <p className="mt-1 mb-5 text-body-small text-balance text-text-secondary">
          وقتی پزشکت دارو رو مشخص کرد، انتخابش کن تا تزریق‌ها و یادآوری‌ها شروع بشن.
        </p>
        <Button onClick={() => onEdit("drug")}>انتخاب دارو</Button>
      </Card>
    );
  }

  const med = o.medication && "id" in o.medication ? findMedication(o.medication.id) : undefined;
  const mg = currentDoseMg(o);
  const rhythm = rhythmOf(o.medication);
  const state = doseState(o, injections, now);
  const time = o.schedule ? `ساعت ${formatTime(o.schedule.time)}` : "تنظیم نشده";
  const when =
    rhythm === "daily" || !("due" in state) ? `هر روز، ${time}` : `${WEEKDAYS[weekdayOf(state.due)]}‌ها، ${time}`;
  const start = treatmentStart(o, injections);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3.5">
        {med ? (
          <DrugFlag medication={med} size={48} />
        ) : (
          <OptionGlyph>
            <PenInjector size={20} />
          </OptionGlyph>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-title-section text-text-primary">
            {med ? <DrugName medication={med} /> : medicationName(o.medication)}
          </h2>
          <p className="text-caption text-text-secondary">
            {med ? `ماده‌ی مؤثر: ${med.generic}` : RHYTHM_GROUP[rhythm]}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onEdit("drug")}
          className="-me-2 h-11 shrink-0 rounded-full px-3 text-label text-text-brand active:bg-surface-brand-subtle"
        >
          تغییر
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <InfoTile
          label="دوز فعلی"
          value={mg !== null ? `${formatMg(mg)} میلی‌گرم` : "ثبت نشده"}
          onClick={() => onEdit("dose")}
        />
        <InfoTile label="زمان تزریق" value={when} onClick={() => onEdit("time")} />
      </div>

      {start ? (
        <p className="mt-4 text-caption text-text-secondary">
          {start <= today
            ? `شروع درمان: ${formatJalali(start, false)}، الان روز ${toFaDigits(daysBetween(start, today) + 1)}`
            : `شروع درمان: ${formatJalali(start)}`}
        </p>
      ) : null}

      <p className="mt-3 flex items-start gap-2 border-t border-violet-100 pt-3 text-caption text-text-secondary">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-violet-400" />
        دوز رو فقط پزشکت تعیین می‌کنه؛ اینجا فقط ثبتش می‌کنی.
      </p>
    </Card>
  );
}

function InfoTile({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}: ${value}. تغییر`}
      className="relative flex flex-col items-start rounded-[18px] bg-surface-brand-subtle px-4 py-3 text-start transition-colors active:bg-violet-100"
    >
      <span className="text-caption text-text-secondary">{label}</span>
      <span className="text-label text-text-primary">{value}</span>
      <Pencil size={14} className="absolute top-3.5 left-3.5 text-violet-400" aria-hidden="true" />
    </button>
  );
}

function SiteCard() {
  const { injections } = useAppData();
  const suggested = suggestSite(injections);
  const last = injections.findLast((i) => i.site)?.site ?? null;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-5">
        <BodyMap suggested={suggested} last={last} use={recentSiteUse(injections)} height={232} />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div>
            <p className="text-caption text-text-secondary">جای بعدی</p>
            <p className="font-display text-[22px] leading-snug font-bold text-text-brand">{SITE_LABEL[suggested]}</p>
            <p className="text-caption text-text-secondary">
              {last ? `آخرین بار: ${SITE_LABEL[last]}` : "هنوز جایی ثبت نشده"}
            </p>
          </div>
          <ul className="flex flex-col gap-2 text-caption text-text-secondary" aria-label="راهنما">
            <Legend swatch="bg-brand">پیشنهاد بعدی</Legend>
            <Legend swatch="bg-violet-300">تزریق‌های اخیر</Legend>
            <Legend swatch="border border-dashed border-violet-300 bg-surface">استراحت کرده</Legend>
          </ul>
        </div>
      </div>
      <p className="mt-4 border-t border-violet-100 pt-3 text-caption text-text-secondary">
        هر بار جای تزریق رو عوض کن تا پوست فرصت استراحت داشته باشه.
      </p>
    </Card>
  );
}

function Legend({ swatch, children }: { swatch: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden="true" className={`size-3 shrink-0 rounded-full ${swatch}`} />
      {children}
    </li>
  );
}
