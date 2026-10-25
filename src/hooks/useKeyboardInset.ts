"use client";

import { useSyncExternalStore } from "react";

/**
 * Height of the on-screen keyboard in px, via the visual viewport.
 * On iOS the keyboard covers the page instead of resizing it, so bottom actions
 * read this to stay just above the keyboard.
 */
function subscribe(cb: () => void) {
  const vv = window.visualViewport;
  if (!vv) return () => {};
  vv.addEventListener("resize", cb);
  vv.addEventListener("scroll", cb);
  return () => {
    vv.removeEventListener("resize", cb);
    vv.removeEventListener("scroll", cb);
  };
}

function getSnapshot() {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
}

export function useKeyboardInset(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}
