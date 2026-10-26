"use client";

/**
 * A small piece of state kept in memory and mirrored to localStorage, read in components with
 * useSyncExternalStore (the pattern the onboarding and app stores use). Storage can be
 * unavailable (private mode), so every access is guarded and the memory copy is the source of
 * truth. Missing fields in stored data are filled from `empty`, so new fields need no migration.
 *
 * MOCK: these move to the Django API once it exists.
 */
export function createLocalStore<T extends object>(key: string, empty: T) {
  const listeners = new Set<() => void>();
  let state: T | null = null;

  function read(): T {
    if (state) return state;
    try {
      const raw = window.localStorage.getItem(key);
      state = raw ? { ...empty, ...JSON.parse(raw) } : empty;
    } catch {
      state = empty;
    }
    return state!;
  }

  function write(next: T) {
    state = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // storage unavailable; keep the in-memory copy
    }
    listeners.forEach((l) => l());
  }

  return {
    read,
    write,
    update: (fn: (current: T) => T) => write(fn(read())),
    reset: () => write(empty),
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** What the server and the first client render see. */
    serverSnapshot: () => empty,
  };
}
