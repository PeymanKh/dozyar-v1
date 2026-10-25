import type { Metadata } from "next";
import { NameStep } from "@/components/onboarding/NameStep";

export const metadata: Metadata = { title: "اسمت | دوزیار" };

export default function Page() {
  return <NameStep />;
}
