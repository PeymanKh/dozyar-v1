"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { ChevronBack, Sparkles } from "@/components/ui/icons";
import { useOnboarding } from "@/lib/onboarding-store";

/** True once the page has scrolled past `offset` px (the large title is gone). */
function useScrolledPast(offset: number) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    let frame = 0;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setPast(window.scrollY > offset));
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", check);
      // A hidden (cached) screen must not leave its bar over the next one.
      setPast(false);
    };
  }, [offset]);
  return past;
}

/**
 * Screen header in the iOS large-title style: a small caption over a large title on the
 * start side, and round buttons on the left: on tab screens the assistant and the profile
 * (so both are one tap away from every tab), on pushed screens back. Once the title scrolls
 * away, a compact glass bar takes over with the title in small type, so the person always
 * knows where they are.
 */
export function AppHeader({
  title,
  compactTitle,
  caption,
  back,
}: {
  title: string;
  /** Shorter title for the compact bar (e.g. the tab name instead of a greeting). */
  compactTitle?: string;
  caption?: React.ReactNode;
  /** Pushed screens: where back goes (true = browser back). Tab screens show the profile. */
  back?: string | true;
}) {
  const scrolled = useScrolledPast(52);
  const button = back ? (
    <BackButton href={back} />
  ) : (
    <div className="flex shrink-0 items-center gap-2 self-start">
      <AssistantButton />
      <ProfileButton />
    </div>
  );

  // On <body>: the page frame animates its transform, which would trap a fixed bar.
  const bar = (
    <div
      aria-hidden={!scrolled}
      className={`fixed inset-x-0 top-0 z-30 mx-auto max-w-[480px] transition-opacity duration-200 ${
        scrolled ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="bar-glass grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 pt-[max(env(safe-area-inset-top),10px)] pb-2.5">
        <span aria-hidden="true" />
        <span className="truncate text-body-strong text-text-primary">{compactTitle ?? title}</span>
        <span className="flex justify-end">{scrolled ? button : <span className="size-11" />}</span>
      </div>
    </div>
  );

  return (
    <>
      {typeof document === "undefined" ? null : createPortal(bar, document.body)}
      <header className="flex items-center justify-between gap-3 px-5 pt-[max(env(safe-area-inset-top),14px)] pb-5">
        <div className="min-w-0">
          {caption ? <p className="text-caption text-text-secondary">{caption}</p> : null}
          <h1 className="text-display-large text-balance text-text-primary">{title}</h1>
        </div>
        {button}
      </header>
    </>
  );
}

function BackButton({ href }: { href: string | true }) {
  const router = useRouter();
  return (
    <motion.button
      type="button"
      aria-label="بازگشت"
      onClick={() => (href === true ? router.back() : router.push(href))}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
      className="glass grid size-11 shrink-0 place-items-center self-start rounded-full text-text-primary"
    >
      <ChevronBack size={22} />
    </motion.button>
  );
}

/** The assistant, one tap from every tab. */
function AssistantButton() {
  return (
    <Link
      href="/chat"
      aria-label="دستیار دوزیار"
      className="glass grid size-11 shrink-0 place-items-center rounded-full text-text-brand transition-transform active:scale-95"
    >
      <Sparkles size={20} />
    </Link>
  );
}

/** The person's initial in a soft circle; opens the profile. */
function ProfileButton() {
  const { name } = useOnboarding();
  const initial = name?.trim().charAt(0) || "؟";
  return (
    <Link
      href="/profile"
      aria-label="پروفایل و تنظیمات"
      className="grid size-11 shrink-0 place-items-center rounded-full border border-violet-200 bg-surface font-display text-[17px] font-bold text-text-brand shadow-[0_6px_16px_-8px_rgb(110_75_245/0.35)] transition-transform active:scale-95"
    >
      {initial}
    </Link>
  );
}
