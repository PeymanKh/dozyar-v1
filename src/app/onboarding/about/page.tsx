import type { Metadata } from "next";
import { AboutStep } from "@/components/onboarding/AboutStep";

export const metadata: Metadata = { title: "درباره‌ی خودت | دوزیار" };

export default function Page() {
  return <AboutStep />;
}
