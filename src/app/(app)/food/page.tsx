import type { Metadata } from "next";
import { FoodScreen } from "@/components/app/food/FoodScreen";

// Device data only: see the note in (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "تغذیه | دوزیار" };

export default function Page() {
  return <FoodScreen />;
}
