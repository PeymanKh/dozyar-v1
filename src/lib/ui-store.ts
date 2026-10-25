"use client";

import { useSyncExternalStore } from "react";

/**
 * App-wide UI state that any screen can trigger: the toast (with an optional undo) and
 * the logging sheets, which live once in the app shell so every screen opens the same ones.
 */

function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: T) {
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

// Toast

export type Toast = { id: number; message: string; action?: { label: string; run: () => void } };

const toastStore = createStore<Toast | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let toastId = 0;

/** Shows a short message above the tab bar; with an action (undo) it stays a little longer. */
export function toast(message: string, action?: Toast["action"]) {
  clearTimeout(toastTimer);
  toastStore.set({ id: ++toastId, message, action });
  toastTimer = setTimeout(dismissToast, action ? 5000 : 3200);
}

export function dismissToast() {
  clearTimeout(toastTimer);
  toastStore.set(null);
}

export function useToast(): Toast | null {
  return useSyncExternalStore(toastStore.subscribe, toastStore.get, () => null);
}

// Logging sheets

export type AppSheet = "quick" | "injection" | "weight" | "waist" | null;

const sheetStore = createStore<AppSheet>(null);

export function openSheet(sheet: AppSheet) {
  sheetStore.set(sheet);
}

export function closeSheet() {
  sheetStore.set(null);
}

export function useAppSheet(): AppSheet {
  return useSyncExternalStore(sheetStore.subscribe, sheetStore.get, () => null);
}

/** A short tap of the motor where the phone supports it (Android); harmless elsewhere. */
export function haptic(ms = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(ms);
}
