import type { Metadata } from "next";
import { MedicationStep } from "@/components/onboarding/MedicationStep";

export const metadata: Metadata = { title: "داروت | دوزیار" };

export default function Page() {
  return <MedicationStep />;
}
