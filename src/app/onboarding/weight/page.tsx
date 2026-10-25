import type { Metadata } from "next";
import { WeightStep } from "@/components/onboarding/WeightStep";

export const metadata: Metadata = { title: "وزنت | دوزیار" };

export default function Page() {
  return <WeightStep />;
}
