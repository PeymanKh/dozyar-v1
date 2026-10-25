import type { Metadata } from "next";
import { OtpStep } from "@/components/onboarding/OtpStep";

export const metadata: Metadata = { title: "کد تأیید | دوزیار" };

export default function Page() {
  return <OtpStep />;
}
