"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";
import { MealCamera } from "./food/MealCamera";
import { InjectionSheet } from "./sheets/InjectionSheet";
import { MealSheet } from "./sheets/MealSheet";
import { LogWeightSheet, WaistSheet } from "./sheets/MeasureSheets";
import { QuickAddSheet } from "./sheets/QuickAddSheet";
import { isTabRoute, TabBar } from "./TabBar";
import { Toaster } from "./Toaster";
import { readAppData, seedFromOnboarding } from "@/lib/app-store";
import { loadSamplePerson } from "@/lib/demo-data";
import { hasAnswers, readOnboarding, useHydrated } from "@/lib/onboarding-store";
import { closeSheet, useAppSheet } from "@/lib/ui-store";
import { useToday } from "@/lib/use-now";

/**
 * Frame for the app screens. Every screen opens directly, with no sign-in and no redirects
 * (this is a prototype), and holds what every screen shares: the tab bar, the logging sheets
 * (and the meal camera) and the toast.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const today = useToday();
  const sheet = useAppSheet();

  // Filled when the app opens, from the onboarding answers, or with a sample person when there
  // are none, so no screen opens empty. Not again while it is open, so erasing or starting over
  // in Profile isn't undone on the spot. Before paint, so a screen never flashes empty.
  useLayoutEffect(() => {
    if (!hydrated || !today || readAppData().seeded) return;
    const answers = readOnboarding();
    if (hasAnswers(answers)) seedFromOnboarding(answers, today);
    else loadSamplePerson(today);
  }, [hydrated, today]);

  // Leaving a screen closes any logging sheet that was open on it.
  useEffect(() => closeSheet, [pathname]);

  if (!hydrated) return <div className="bg-app min-h-dvh" />;

  const tabs = isTabRoute(pathname);
  return (
    <>
      {children}
      {tabs ? <TabBar /> : null}
      <QuickAddSheet open={sheet === "quick"} onClose={closeSheet} />
      <InjectionSheet open={sheet === "injection"} onClose={closeSheet} />
      <LogWeightSheet open={sheet === "weight"} onClose={closeSheet} />
      <WaistSheet open={sheet === "waist"} onClose={closeSheet} />
      <MealSheet open={sheet === "meal"} onClose={closeSheet} />
      <MealCamera />
      <Toaster aboveTabBar={tabs} />
    </>
  );
}
