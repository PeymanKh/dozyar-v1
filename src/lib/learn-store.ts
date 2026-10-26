"use client";

import { useSyncExternalStore } from "react";
import { createLocalStore } from "./local-store";

/** Which lessons the person has read (in the order they read them). */

type LearnState = { read: string[] };

const store = createLocalStore<LearnState>("dozyar.learn", { read: [] });

export function useLearn(): LearnState {
  return useSyncExternalStore(store.subscribe, store.read, store.serverSnapshot);
}

export function markRead(id: string) {
  if (store.read().read.includes(id)) return;
  store.update((s) => ({ read: [...s.read, id] }));
}

export function setRead(ids: string[]) {
  store.write({ read: ids });
}

export function resetLearn() {
  store.reset();
}
