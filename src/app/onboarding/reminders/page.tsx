import type { Metadata } from "next";
import { RemindersStep } from "@/components/onboarding/RemindersStep";

export const metadata: Metadata = { title: "یادآوری | دوزیار" };

export default function Page() {
  return <RemindersStep />;
}
