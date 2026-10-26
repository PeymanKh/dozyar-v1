import type { Metadata } from "next";
import { LearnScreen } from "@/components/app/learn/LearnScreen";

// Device data only: see the note in (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "یادگیری | دوزیار" };

export default function Page() {
  return <LearnScreen />;
}
