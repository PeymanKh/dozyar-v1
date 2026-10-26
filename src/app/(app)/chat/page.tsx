import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatScreen } from "@/components/app/chat/ChatScreen";

// Device data only: see the note in (app)/layout.tsx.
export const instant = false;

export const metadata: Metadata = { title: "دستیار | دوزیار" };

export default function Page() {
  // A question can come from the URL (?q=), which is only known in the browser.
  return (
    <Suspense fallback={null}>
      <ChatScreen />
    </Suspense>
  );
}
