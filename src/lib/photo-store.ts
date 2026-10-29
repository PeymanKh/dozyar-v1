"use client";

import { useEffect, useState } from "react";
import { newId } from "./app-store";

/**
 * Progress photos, kept only on this device (IndexedDB) and never uploaded. Images are
 * scaled down before saving so a year of photos stays small.
 */

export type Photo = { id: string; date: string; blob: Blob };
export type PhotoWithUrl = Photo & { url: string };

const DB = "dozyar-photos";
const STORE = "photos";
const MAX_SIDE = 1280;

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

async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.86));
}

const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

export async function addPhoto(file: File, date: string): Promise<Photo> {
  const photo = { id: newId(), date, blob: await shrink(file) };
  await run("readwrite", (s) => s.put(photo));
  changed();
  return photo;
}

export async function restorePhoto(photo: Photo) {
  await run("readwrite", (s) => s.put(photo));
  changed();
}

export async function deletePhoto(id: string) {
  await run("readwrite", (s) => s.delete(id));
  changed();
}

/** Erasing data or starting over: no photo stays on the phone. */
export async function clearPhotos() {
  await run("readwrite", (s) => s.clear()).catch(() => undefined);
  changed();
}

/** All photos, oldest first, with object URLs that are released when no longer shown. */
export function usePhotos(): PhotoWithUrl[] | null {
  const [photos, setPhotos] = useState<PhotoWithUrl[] | null>(null);

  useEffect(() => {
    let urls: string[] = [];
    let alive = true;
    const load = async () => {
      const all = await run<Photo[]>("readonly", (s) => s.getAll()).catch(() => []);
      if (!alive) return;
      urls.forEach(URL.revokeObjectURL);
      const sorted = all.sort((a, b) => a.date.localeCompare(b.date));
      const next = sorted.map((p) => ({ ...p, url: URL.createObjectURL(p.blob) }));
      urls = next.map((p) => p.url);
      setPhotos(next);
    };
    load();
    listeners.add(load);
    return () => {
      alive = false;
      listeners.delete(load);
      urls.forEach(URL.revokeObjectURL);
    };
  }, []);

  return photos;
}
