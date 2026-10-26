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

export type AppSheet = "quick" | "injection" | "weight" | "waist" | "meal" | null;

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

// Logging a meal

/**
 * What the meal sheet opens with: a photo to recognise, nothing (adding food by hand), or a
 * meal already logged (to change or delete it).
 */
export type MealDraft = { kind: "photo"; photo: Blob } | { kind: "manual" } | { kind: "edit"; mealId: string };

/** `seq` tells one opening from the next, so the sheet starts fresh each time. */
const mealDraftStore = createStore<(MealDraft & { seq: number }) | null>(null);
let mealSeq = 0;

export function openMeal(draft: MealDraft) {
  mealDraftStore.set({ ...draft, seq: ++mealSeq });
  sheetStore.set("meal");
}

export function useMealDraft(): (MealDraft & { seq: number }) | null {
  return useSyncExternalStore(mealDraftStore.subscribe, mealDraftStore.get, () => null);
}

/**
 * The one hidden photo input lives in the app shell; any «عکس غذا» button calls this inside
 * its tap, which is when browsers allow opening the camera or the photo library.
 */
let mealInput: HTMLInputElement | null = null;

export function registerMealInput(el: HTMLInputElement | null) {
  mealInput = el;
}

export function pickMealPhoto() {
  mealInput?.click();
}

/** A short tap of the motor where the phone supports it (Android); harmless elsewhere. */
export function haptic(ms = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(ms);
}
