"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StepScreen } from "./StepScreen";
import { Check, Pencil } from "@/components/ui/icons";
import { OtpInput, type OtpInputHandle } from "@/components/ui/OtpInput";
import { Spinner } from "@/components/ui/Spinner";
import { OTP_LENGTH, RESEND_SECONDS, requestOtp, verifyOtp } from "@/lib/auth";
import { toFaDigits } from "@/lib/digits";
import { formatMobile } from "@/lib/phone";
import { readOnboarding, resumeRoute, useHydrated, useOnboarding } from "@/lib/onboarding-store";
import code from "../../../public/onboarding/code.png";

type Status = "idle" | "verifying" | "error" | "success";

/**
 * Five code cells (OtpInput). iOS offers the code from Messages above the keyboard;
 * one tap fills every cell and we verify automatically after a short pause so the person
 * can see the code land.
 */
export function OtpStep() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { mobile } = useOnboarding();
  const field = useRef<OtpInputHandle>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resent, setResent] = useState(false);

  // Pages stay mounted but hidden after navigating away (cacheComponents / Activity).
  // Each visit is a fresh code: clear the cells, unlock, restart the resend timer.
  useLayoutEffect(() => {
    const cells = field.current;
    cells?.focus();
    return () => {
      cells?.clear();
      setStatus("idle");
      setResent(false);
      setSecondsLeft(RESEND_SECONDS);
    };
  }, []);

  // No number yet (opened directly or after a reset): go back to the phone step.
  useEffect(() => {
    if (hydrated && !mobile) router.replace("/onboarding/phone");
  }, [hydrated, mobile, router]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  async function verify(value: string) {
    if (!mobile) return;
    setStatus("verifying");
    const res = await verifyOtp(mobile, value);
    if (res.ok) {
      setStatus("success");
      if ("vibrate" in navigator) navigator.vibrate?.(12);
      // Continue where they stopped: the first onboarding screen without an answer.
      setTimeout(() => router.push(resumeRoute(readOnboarding())), 700);
      return;
    }
    // The cells shake; once it settles, empty them for a fresh try. The message stays until they type.
    setStatus("error");
    setTimeout(() => field.current?.clear(), 420);
  }

  function onChange(value: string) {
    if (status === "error" && value.length > 0) setStatus("idle");
  }

  async function resend() {
    if (!mobile) return;
    setSecondsLeft(RESEND_SECONDS);
    setResent(true);
    setStatus("idle");
    field.current?.clear();
    await requestOtp(mobile);
  }

  const locked = status === "verifying" || status === "success";
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <StepScreen
      backHref="/onboarding/phone"
      icon={code}
      title="کد تأیید"
      description={
        <>
          <p>
            کد {toFaDigits(OTP_LENGTH)} رقمی رو به{" "}
            <bdi dir="ltr" className="font-semibold text-text-primary">
              {mobile ? formatMobile(mobile) : "…"}
            </bdi>{" "}
            پیامک کردیم.
          </p>
          <Link
            href="/onboarding/phone"
            className="mt-0.5 inline-flex items-center gap-1.5 py-2 text-label text-text-brand"
          >
            <Pencil size={14} />
            ویرایش شماره
          </Link>
        </>
      }
    >
      <OtpInput
        ref={field}
        length={OTP_LENGTH}
        status={status === "error" ? "error" : status === "success" ? "success" : "idle"}
        disabled={locked}
        onChange={onChange}
        onComplete={(value) => setTimeout(() => void verify(value), 250)}
        describedBy="otp-status"
        className="mt-1"
      />

      {/* Status and resend */}
      <div id="otp-status" className="mt-5 flex min-h-12 items-center justify-center" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {status === "verifying" ? (
            <motion.p key="v" {...fade} className="flex items-center gap-2 text-caption text-text-secondary">
              <Spinner size={15} className="text-brand" />
              در حال بررسی…
            </motion.p>
          ) : status === "success" ? (
            <motion.p key="s" {...fade} className="flex items-center gap-2 text-caption text-text-brand">
              <Check size={16} />
              تأیید شد
            </motion.p>
          ) : status === "error" ? (
            <motion.p key="e" {...fade} role="alert" className="text-caption text-text-brand">
              این کد درست نیست. دوباره امتحان کن.
            </motion.p>
          ) : secondsLeft > 0 ? (
            <motion.p key="t" {...fade} className="text-caption text-text-tertiary">
              {resent ? "کد جدید فرستاده شد. " : ""}ارسال دوباره تا{" "}
              <bdi dir="ltr" className="font-semibold text-text-secondary tabular-nums">
                {toFaDigits(`${mm}:${ss}`)}
              </bdi>
            </motion.p>
          ) : (
            <motion.button
              key="r"
              {...fade}
              type="button"
              onClick={resend}
              whileTap={{ scale: 0.96 }}
              className="rounded-full px-4 py-3 text-label text-text-brand"
            >
              کد رو نگرفتی؟ ارسال دوباره
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </StepScreen>
  );
}

const fade = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { type: "spring" as const, bounce: 0, duration: 0.3 },
};
