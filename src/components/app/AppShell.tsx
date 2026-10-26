"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { MealCamera } from "./food/MealCamera";
import { InjectionSheet } from "./sheets/InjectionSheet";
import { MealSheet } from "./sheets/MealSheet";
import { LogWeightSheet, WaistSheet } from "./sheets/MeasureSheets";
import { QuickAddSheet } from "./sheets/QuickAddSheet";
import { isTabRoute, TabBar } from "./TabBar";
import { Toaster } from "./Toaster";
import { seedFromOnboarding, useAppData } from "@/lib/app-store";
import { readOnboarding, resumeRoute, useHydrated, useOnboarding } from "@/lib/onboarding-store";
import { closeSheet, useAppSheet } from "@/lib/ui-store";
import { useToday } from "@/lib/use-now";

/**
 * Frame for the signed-in app. Sends people who haven't signed in (or finished onboarding)
 * to where they belong, turns the onboarding answers into the first logs once, and holds
 * what every screen shares: the tab bar, the logging sheets (and the meal camera) and the toast.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const onboarding = useOnboarding();
  const { seeded } = useAppData();
  const today = useToday();
  const sheet = useAppSheet();

  const route = hydrated ? (onboarding.mobile ? resumeRoute(onboarding) : "/") : null;
  const ready = route === "/today";

  useEffect(() => {
    if (route && route !== "/today") router.replace(route);
  }, [route, router]);

  useEffect(() => {
    if (ready && today && !seeded) seedFromOnboarding(readOnboarding(), today);
  }, [ready, today, seeded]);

  // Leaving a screen closes any logging sheet that was open on it.
  useEffect(() => closeSheet, [pathname]);

  if (!ready) return <div className="bg-app min-h-dvh" />;

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
