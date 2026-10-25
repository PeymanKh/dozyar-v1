import type { Metadata } from "next";
import { GoalStep } from "@/components/onboarding/GoalStep";

export const metadata: Metadata = { title: "هدفت | دوزیار" };

export default function Page() {
  return <GoalStep />;
}
