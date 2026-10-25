import type { Metadata } from "next";
import { ReportScreen } from "@/components/app/report/ReportScreen";

// Device data only: see the note in (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "گزارش برای پزشک | دوزیار" };

export default function Page() {
  return <ReportScreen />;
}
