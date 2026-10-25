"use client";

import { useSyncExternalStore } from "react";
import { isoOf } from "./jalali";

/**
 * The current time, read only in the browser. With cacheComponents, Next prerenders pages
 * and forbids `new Date()` during that render; the server snapshot is null instead.
 * Ticks every minute so countdowns stay right while a screen is open.
 */
let clock: Date | null = null;

function subscribe(onChange: () => void) {
  clock = new Date();
  const id = setInterval(() => {
    clock = new Date();
    onChange();
  }, 60_000);
  return () => clearInterval(id);
}

export function useNow(): Date | null {
  return useSyncExternalStore(
    subscribe,
    () => clock ?? (clock = new Date()),
    () => null,
  );
}

/** Today's date as ISO "YYYY-MM-DD", or null before the browser takes over. */
export function useToday(): string | null {
  const now = useNow();
  return now ? isoOf(now) : null;
}
