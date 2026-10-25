import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckInScreen } from "@/components/app/symptoms/CheckInScreen";

// Device data only: see the note in (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "حال امروز | دوزیار" };

export default function Page() {
  // The date and the chosen face come from the URL, which is only known in the browser.
  return (
    <Suspense fallback={null}>
      <CheckInScreen />
    </Suspense>
  );
}
