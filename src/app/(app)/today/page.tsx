import type { Metadata } from "next";
import { TodayScreen } from "@/components/app/today/TodayScreen";

// Device data only: see the note in (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "امروز | دوزیار" };

export default function Page() {
  return <TodayScreen />;
}
