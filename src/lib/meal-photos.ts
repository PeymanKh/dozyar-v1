"use client";

import { useEffect, useState } from "react";
import { newId } from "./app-store";

/**
 * Meal photos, kept only on this device (IndexedDB), scaled down to a small size since they
 * are only shown as thumbnails and in the meal sheet. Separate from the progress photos
 * (photo-store), which are kept larger. A meal refers to its photo by id.
 */

const DB = "dozyar-meal-photos";
const STORE = "photos";
const MAX_SIDE = 720;

type Stored = { id: string; blob: Blob };

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const conn = await db();
  return new Promise((resolve, reject) => {
    const req = fn(conn.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** The photo scaled to fit MAX_SIDE, as a JPEG. Falls back to the original when it can't be read. */
export async function shrinkPhoto(file: Blob, maxSide = MAX_SIDE): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.84));
  } catch {
    return file;
  }
}

/** Saves a (shrunk) photo and returns its id. */
export async function saveMealPhoto(blob: Blob): Promise<string> {
  const id = newId();
  await run("readwrite", (s) => s.put({ id, blob } satisfies Stored));
  return id;
}

export async function deleteMealPhoto(id: string) {
  await run("readwrite", (s) => s.delete(id)).catch(() => undefined);
}

/** Erasing data or signing out. */
export async function clearMealPhotos() {
  await run("readwrite", (s) => s.clear()).catch(() => undefined);
}

/** An object URL for a meal's photo while the component is shown; null until loaded or without one. */
export function useMealPhoto(id: string | undefined): string | null {
  const [url, setUrl] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    let made: string | null = null;
    run<Stored | undefined>("readonly", (s) => s.get(id))
      .then((row) => {
        if (!alive || !row) return;
        made = URL.createObjectURL(row.blob);
        setUrl({ id, url: made });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [id]);

  return id && url?.id === id ? url.url : null;
}
