import { AppShell } from "@/components/app/AppShell";

// These screens show what is stored on the device, so the server prerenders only the empty
// frame; skip the instant-navigation check, which expects the page itself in the prerender.
export const instant = false;

/** Signed-in screens share the shell: tab bar, logging sheets and toasts. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
