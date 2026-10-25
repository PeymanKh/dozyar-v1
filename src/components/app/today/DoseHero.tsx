"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { SITE_LABEL } from "@/components/app/BodyMap";
import { CountdownRing } from "@/components/app/CountdownRing";
import { HeroActions, HeroButton, HeroFrame } from "@/components/app/HeroCard";
import { Check } from "@/components/ui/icons";
import { useAppData } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { daysBetween, formatJalali, isoOf } from "@/lib/jalali";
import { useOnboarding } from "@/lib/onboarding-store";
import { countdown, formatMg, formatTime, medicationName } from "@/lib/plan";
import { currentDoseMg, cycleProgress, doseState, suggestSite } from "@/lib/treatment";
import { openSheet } from "@/lib/ui-store";
import penIcon from "../../../../public/onboarding/medication.png";

/** «امروز» / «فردا» / «پنجشنبه ۸ آبان» */
export function relativeDay(iso: string, today: string): string {
  const d = daysBetween(today, iso);
  if (d === 0) return "امروز";
  if (d === 1) return "فردا";
  if (d === -1) return "دیروز";
  return formatJalali(iso);
}

/**
 * Today's one most important thing, on the brand gradient: the next injection. The ring
 * counts down the cycle; the button logs it. States: upcoming, due today, late (worded
 * without blame, and pointing to the doctor rather than advising), logged today, and no
 * drug yet.
 */
export function DoseHero({ now }: { now: Date }) {
  const router = useRouter();
  const o = useOnboarding();
  const { injections } = useAppData();
  const state = doseState(o, injections, now);
  const today = isoOf(now);

  if (state.kind === "no-drug" || state.kind === "no-schedule") {
    return (
      <HeroFrame label="تزریق">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-caption text-white/80">داروت</p>
            <h2 className="mt-1 font-display text-[21px] leading-snug font-bold">هنوز داروت مشخص نیست</h2>
            <p className="mt-1.5 text-body-small text-pretty text-white/85">
              وقتی پزشکت دارو رو مشخص کرد، اضافه‌اش کن تا یادآوری تزریق شروع بشه.
            </p>
          </div>
          <Image src={penIcon} alt="" width={88} height={88} className="size-22 shrink-0 object-contain" />
        </div>
        <HeroActions>
          <HeroButton onClick={() => router.push("/treatment")}>انتخاب دارو</HeroButton>
        </HeroActions>
      </HeroFrame>
    );
  }

  const drug = medicationName(o.medication);
  const mg = currentDoseMg(o);
  const drugLine = [drug, mg !== null ? `${formatMg(mg)} میلی‌گرم` : null].filter(Boolean).join("، ");
  const site = suggestSite(injections);
  const passed = now >= state.dueAt;

  let caption: string;
  let title: string;
  let lines: string[];
  let ring: React.ComponentProps<typeof CountdownRing>;

  if (state.loggedToday) {
    caption = "تزریق امروز ثبت شد";
    title = `بعدی: ${relativeDay(state.due, today)}`;
    lines = [`ساعت ${formatTime(state.time)}`, drugLine];
    ring = { progress: 1, center: <Check size={34} strokeWidth={2.6} className="text-white" /> };
  } else if (state.kind === "late") {
    caption = state.first ? "اولین تزریقت ثبت نشده" : "تزریق ثبت نشده";
    title = relativeDay(state.due, today);
    lines = ["اگه زدی، ثبتش کن. اگه جا افتاده، برای ادامه با پزشکت هماهنگ کن."];
    ring = { progress: 1, primary: toFaDigits(-state.daysLeft), secondary: "روز گذشته" };
  } else {
    caption = state.first ? "اولین تزریقت" : state.kind === "today" ? "امروز وقت تزریقه" : "تزریق بعدی";
    title = state.kind === "today" ? `امروز، ساعت ${formatTime(state.time)}` : relativeDay(state.due, today);
    lines = state.kind === "today" ? [drugLine] : [`ساعت ${formatTime(state.time)}`, drugLine];
    // The number alone in the middle; its unit sits under it with «مونده».
    const left = countdown(state.dueAt, state.rhythm, now);
    ring = passed
      ? { progress: 1, primary: "وقتشه", secondary: `ساعت ${formatTime(state.time)}` }
      : { progress: cycleProgress(state, now), primary: left.value, secondary: `${left.unit} مونده` };
  }

  return (
    <HeroFrame label="تزریق">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-caption text-white/80">{caption}</p>
          <h2 className="mt-1 font-display text-[21px] leading-snug font-bold">{title}</h2>
          <div className="mt-1.5 text-body-small text-pretty text-white/85">
            {lines.filter(Boolean).map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        </div>
        <CountdownRing tone="light" size={100} {...ring} />
      </div>
      <HeroActions>
        {state.loggedToday ? (
          <HeroButton quiet onClick={() => router.push("/treatment")}>
            تاریخچه‌ی تزریق
          </HeroButton>
        ) : (
          <HeroButton onClick={() => openSheet("injection")}>ثبت تزریق</HeroButton>
        )}
        <span className="flex h-12 shrink-0 items-center rounded-full bg-white/14 px-4 text-caption text-white">
          جای بعدی: {SITE_LABEL[site]}
        </span>
      </HeroActions>
    </HeroFrame>
  );
}
