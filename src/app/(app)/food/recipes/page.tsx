import type { Metadata } from "next";
import { Suspense } from "react";
import { RecipesScreen } from "@/components/app/food/RecipesScreen";

// Device data only: see the note in (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "دستور پخت | دوزیار" };

export default function Page() {
  // The filter can come from the URL (?tag=), which is only known in the browser.
  return (
    <Suspense fallback={null}>
      <RecipesScreen />
    </Suspense>
  );
}
