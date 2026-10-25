import type { Metadata } from "next";
import { SymptomsScreen } from "@/components/app/symptoms/SymptomsScreen";

// Device data only: see the note in (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "حال من | دوزیار" };

export default function Page() {
  return <SymptomsScreen />;
}
