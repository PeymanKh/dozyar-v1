import type { Metadata } from "next";
import { ProgressScreen } from "@/components/app/progress/ProgressScreen";

// Device data only: see the note in (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "پیشرفت | دوزیار" };

export default function Page() {
  return <ProgressScreen />;
}
