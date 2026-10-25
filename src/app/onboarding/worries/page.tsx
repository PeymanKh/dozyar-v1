import type { Metadata } from "next";
import { WorriesStep } from "@/components/onboarding/WorriesStep";

export const metadata: Metadata = { title: "نگرانی‌ها | دوزیار" };

export default function Page() {
  return <WorriesStep />;
}
