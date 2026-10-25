import type { Metadata } from "next";
import { JourneyStep } from "@/components/onboarding/JourneyStep";

export const metadata: Metadata = { title: "کجای مسیری؟ | دوزیار" };

export default function Page() {
  return <JourneyStep />;
}
