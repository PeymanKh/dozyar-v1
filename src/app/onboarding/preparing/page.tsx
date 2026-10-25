import type { Metadata } from "next";
import { PreparingStep } from "@/components/onboarding/PreparingStep";

export const metadata: Metadata = { title: "آماده‌سازی | دوزیار" };

export default function Page() {
  return <PreparingStep />;
}
