import type { Metadata } from "next";
import { ProfileScreen } from "@/components/app/profile/ProfileScreen";

// Device data only: see the note in (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "پروفایل | دوزیار" };

export default function Page() {
  return <ProfileScreen />;
}
