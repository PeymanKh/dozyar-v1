"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StepScreen } from "./StepScreen";
import { Button } from "@/components/ui/Button";
import { Bell, PlusSquare, Share } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { Toggle } from "@/components/ui/Toggle";
import { WEEKDAYS } from "@/lib/jalali";
import { progressFor } from "@/lib/onboarding-flow";
import { setOnboarding, useOnboarding, type ReminderAnswer } from "@/lib/onboarding-store";
import { doseLabel, formatTime, medicationName, rhythmOf } from "@/lib/plan";
import remindersIcon from "../../../public/onboarding/reminders.png";

/**
 * Web push on iPhone only works once the app is on the home screen. Read once on the client.
 */
function useNeedsHomeScreen(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
      return ios && !standalone;
    },
    () => false,
  );
}

/**
 * Screen 10 (optional). Reminders are the core free feature. Discreet by default, so the
 * drug name never shows on a lock screen; SMS covers phones where web push is unreliable.
 */
export function RemindersStep() {
  const router = useRouter();
  const { medication, dose, schedule, reminders } = useOnboarding();
  const weekly = rhythmOf(medication) === "weekly";
  const needsHomeScreen = useNeedsHomeScreen();
  const [settings, setSettings] = useState<Omit<ReminderAnswer, "channel"> | null>(null);
  const s = settings ?? {
    discreet: reminders?.discreet ?? true,
    nightBefore: reminders?.nightBefore ?? false,
    smsBackup: reminders?.smsBackup ?? true,
  };
  const set = (patch: Partial<typeof s>) => setSettings({ ...s, ...patch });
  const [refused, setRefused] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [asking, setAsking] = useState(false);

  const time = formatTime(schedule?.time ?? "21:00");
  const when = weekly && schedule?.day !== null && schedule?.day !== undefined ? `${WEEKDAYS[schedule.day]}‌ها` : "هر روز";
  const name = medicationName(medication);
  const doseText = doseLabel(dose);
  const preview = s.discreet
    ? "یه یادآوری کوچیک برات داریم."
    : name
      ? `وقت تزریق ${name}${doseText ? `، ${doseText}` : ""}.`
      : "وقت تزریقته.";

  function finish(channel: ReminderAnswer["channel"]) {
    setOnboarding({ reminders: { ...s, nightBefore: weekly && s.nightBefore, smsBackup: weekly && s.smsBackup, channel } });
    // Straight into the short "preparing" moment, which then opens Today.
    router.replace("/onboarding/preparing");
  }

  async function turnOn() {
    if (!("Notification" in window)) return setRefused(true);
    setAsking(true);
    const result = await Notification.requestPermission();
    setAsking(false);
    if (result === "granted") finish("push");
    else setRefused(true);
  }

  return (
    <StepScreen
      progress={progressFor(10)}
      backHref="/onboarding/worries"
      icon={remindersIcon}
      title="یادت می‌ندازیم"
      description={`${when} ساعت ${time} یه یادآوری کوچیک می‌فرستیم.`}
      action={
        refused ? (
          <Button onClick={() => finish("sms")}>ادامه</Button>
        ) : (
          <div className="flex flex-col gap-1">
            <Button variant="plain" onClick={() => finish("off")}>
              فعلاً نه
            </Button>
            {needsHomeScreen ? (
              <Button onClick={() => setInstallOpen(true)}>اضافه کردن به صفحه‌ی اصلی</Button>
            ) : (
              <Button loading={asking} onClick={turnOn}>
                روشن کردن یادآوری
              </Button>
            )}
          </div>
        )
      }
    >
      {/* Lock-screen preview: changes live with the discreet switch */}
      <div className="glass mx-auto flex w-full items-start gap-3 rounded-[22px] p-3.5" aria-label="پیش‌نمایش اعلان">
        <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-brand-gradient text-text-on-brand">
          <Bell size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between">
            <span className="text-label text-text-primary">دوزیار</span>
            <span className="text-caption-small text-text-tertiary">الان</span>
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={preview}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ type: "spring", bounce: 0, duration: 0.25 }}
              className="block text-caption text-text-secondary"
            >
              {preview}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>

      <div className="mt-6 mb-4 overflow-hidden rounded-[20px] border border-violet-200 bg-surface [&>*+*]:border-t [&>*+*]:border-violet-100">
        <Toggle
          checked={s.discreet}
          onChange={(discreet) => set({ discreet })}
          label="یادآوری محرمانه"
          helper="اسم دارو و کلمه‌ی تزریق روی صفحه‌ی قفل نمیاد."
        />
        {weekly ? (
          <>
            <Toggle
              checked={s.nightBefore}
              onChange={(nightBefore) => set({ nightBefore })}
              label="شب قبلش هم بگو"
              helper="برای اینکه قلم رو از یخچال دربیاری."
            />
            <Toggle
              checked={s.smsBackup}
              onChange={(smsBackup) => set({ smsBackup })}
              label="پیامک پشتیبان"
              helper="اگه اعلان نرسید، یه پیامک بی‌نشون می‌فرستیم."
            />
          </>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {refused ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-caption text-balance text-text-secondary"
            role="status"
          >
            باشه. یادآوری‌ها فعلاً با پیامک میان؛ هر وقت خواستی از تنظیمات روشنش کن.
          </motion.p>
        ) : null}
      </AnimatePresence>

      <Sheet open={installOpen} onClose={() => setInstallOpen(false)} title="اول دوزیار رو به صفحه‌ی اصلی اضافه کن">
        <ol className="flex flex-col gap-3">
          {[
            { icon: <Share size={20} />, text: "دکمه‌ی اشتراک‌گذاری پایین صفحه رو بزن." },
            { icon: <PlusSquare size={20} />, text: "«افزودن به صفحه‌ی اصلی» (Add to Home Screen) رو انتخاب کن." },
            { icon: <Bell size={20} />, text: "دوزیار رو از صفحه‌ی اصلی باز کن؛ همین‌جا ادامه می‌دی." },
          ].map((step, i) => (
            <li key={i} className="flex items-center gap-3 rounded-[16px] bg-surface-brand-subtle p-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface text-text-brand">{step.icon}</span>
              <span className="text-body-small text-text-primary">{step.text}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col gap-1">
          <Button onClick={() => setInstallOpen(false)}>فهمیدم</Button>
          <Button
            variant="plain"
            onClick={() => {
              setInstallOpen(false);
              finish("sms");
            }}
          >
            فعلاً فقط پیامک
          </Button>
        </div>
      </Sheet>
    </StepScreen>
  );
}
