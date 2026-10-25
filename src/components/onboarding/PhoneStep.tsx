"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StepScreen } from "./StepScreen";
import { Button } from "@/components/ui/Button";
import { Info } from "@/components/ui/icons";
import { requestOtp } from "@/lib/auth";
import { formatMobile, hasInvalidPrefix, isValidMobile, normalizeMobile } from "@/lib/phone";
import { setOnboarding, useOnboarding } from "@/lib/onboarding-store";
import phone from "../../../public/onboarding/phone.png";

export function PhoneStep() {
  const router = useRouter();
  const saved = useOnboarding().mobile;
  const [draft, setDraft] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobile = draft ?? saved ?? "";

  // Pages stay mounted but hidden after navigating away (cacheComponents / Activity).
  // Coming back must show a ready form, not the "sending" state we left in.
  useLayoutEffect(() => {
    inputRef.current?.focus();
    return () => setSending(false);
  }, []);

  const valid = isValidMobile(mobile);
  const badPrefix = hasInvalidPrefix(mobile);

  async function submit() {
    if (!valid || sending) return;
    setSending(true);
    await requestOtp(mobile);
    setOnboarding({ mobile });
    router.push("/onboarding/otp");
  }

  return (
    <StepScreen
      backHref="/"
      icon={phone}
      title="خوش اومدی!"
      description="شماره موبایلت رو وارد کن تا کد ورود رو برات بفرستیم."
      action={
        <Button disabled={!valid} loading={sending} loadingLabel="در حال ارسال…" onClick={submit}>
          ارسال کد
        </Button>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label
          className={`flex h-14 items-center gap-3 rounded-[18px] border bg-surface px-4 transition-[border-color] duration-200 ${
            badPrefix
              ? "border-violet-400"
              : "border-violet-200 focus-within:border-border-focus"
          }`}
        >
          <span className="text-label text-text-tertiary">موبایل</span>
          <span aria-hidden="true" className="h-5 w-px bg-border-subtle" />
          <input
            ref={inputRef}
            type="tel"
            name="mobile"
            inputMode="numeric"
            autoComplete="tel-national"
            dir="ltr"
            enterKeyHint="send"
            aria-label="شماره موبایل"
            aria-invalid={badPrefix || undefined}
            aria-describedby="mobile-hint"
            placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
            value={formatMobile(mobile)}
            onChange={(e) => setDraft(normalizeMobile(e.target.value))}
            className="h-full min-w-0 flex-1 bg-transparent text-left font-sans text-[18px] font-medium tracking-[0.04em] text-text-primary caret-brand outline-none placeholder:font-normal placeholder:text-text-tertiary/70"
          />
        </label>

        <div id="mobile-hint" className="mt-3 min-h-11 px-2">
          <AnimatePresence initial={false}>
            {badPrefix ? (
              <motion.p key="error" role="alert" {...hint} className="text-center text-caption text-balance text-text-brand">
                <Info size={15} className="me-1.5 inline-block align-[-3px]" />
                شماره موبایل با ۰۹ شروع می‌شه.
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </form>
    </StepScreen>
  );
}

const hint = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { type: "spring" as const, bounce: 0, duration: 0.3 },
};
