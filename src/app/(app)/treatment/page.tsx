import type { Metadata } from "next";
import { TreatmentScreen } from "@/components/app/treatment/TreatmentScreen";

// Device data only: see the note in (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "درمان | دوزیار" };

export default function Page() {
  return <TreatmentScreen />;
}
