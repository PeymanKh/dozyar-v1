import type { Metadata } from "next";
import { DoseStep } from "@/components/onboarding/DoseStep";

export const metadata: Metadata = { title: "دوزت | دوزیار" };

export default function Page() {
  return <DoseStep />;
}
