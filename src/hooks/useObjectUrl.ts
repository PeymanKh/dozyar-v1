"use client";

import { useEffect, useMemo } from "react";

const pending = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * An object URL for a blob while the component is shown. The URL is released a moment after
 * the component goes away, not at once: React may unmount and mount again right away (Strict
 * Mode, a hidden screen coming back), and the same URL must keep working when it does.
 */
export function useObjectUrl(blob: Blob | null): string | null {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => {
    if (!url) return;
    clearTimeout(pending.get(url));
    pending.delete(url);
    return () => {
      pending.set(
        url,
        setTimeout(() => {
          URL.revokeObjectURL(url);
          pending.delete(url);
        }, 1000),
      );
    };
  }, [url]);
  return url;
}
