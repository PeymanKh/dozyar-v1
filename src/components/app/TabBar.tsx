"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { AppleIcon, ChartSpline, House, PenInjector, Plus, Smile } from "@/components/ui/icons";
import { openSheet } from "@/lib/ui-store";

export const TABS = [
  { href: "/today", label: "امروز", icon: House },
  { href: "/food", label: "تغذیه", icon: AppleIcon },
  { href: "/treatment", label: "درمان", icon: PenInjector },
  { href: "/symptoms", label: "حال من", icon: Smile },
  { href: "/progress", label: "پیشرفت", icon: ChartSpline },
] as const;

export function isTabRoute(pathname: string) {
  return TABS.some((t) => t.href === pathname);
}

/**
 * Floating glass tab bar with the five sections, and a separate round button at the end
 * for quick logging (the iOS pattern of a capsule plus one action). The active section has
 * a lavender lens that slides between tabs. Content fades out under the bar.
 */
export function TabBar() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-bg-canvas from-35% to-bg-canvas/0"
      />
      <div className="pointer-events-auto relative flex items-center gap-2.5">
        <nav aria-label="بخش‌های اصلی" className="glass flex h-16 flex-1 items-stretch rounded-full p-1.5">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-full"
              >
                {active ? (
                  <motion.span
                    layoutId="tab-lens"
                    className="absolute inset-0 rounded-full bg-violet-100"
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  />
                ) : null}
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.9}
                  className={`relative transition-colors duration-200 ${active ? "text-text-brand" : "text-text-secondary"}`}
                />
                <span
                  className={`relative text-[12px] leading-none font-semibold transition-colors duration-200 ${
                    active ? "text-text-brand" : "text-text-secondary"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <motion.button
          type="button"
          aria-label="ثبت سریع"
          aria-haspopup="dialog"
          onClick={() => openSheet("quick")}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-gradient text-text-on-brand shadow-glow"
        >
          <Plus size={26} strokeWidth={2.4} />
        </motion.button>
      </div>
    </div>
  );
}
