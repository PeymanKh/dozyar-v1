import type { Metadata } from "next";
import { ScheduleStep } from "@/components/onboarding/ScheduleStep";

export const metadata: Metadata = { title: "برنامه‌ی تزریق | دوزیار" };

export default function Page() {
  return <ScheduleStep />;
}
