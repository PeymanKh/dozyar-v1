import type { Metadata } from "next";
import { PhoneStep } from "@/components/onboarding/PhoneStep";

export const metadata: Metadata = { title: "شماره موبایل | دوزیار" };

export default function Page() {
  return <PhoneStep />;
}
