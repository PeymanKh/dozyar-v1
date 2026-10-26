"use client";

import { useMealPhoto } from "@/lib/meal-photos";

/**
 * A meal or a dish as a small square: its photo when there is one, otherwise its emoji on a
 * soft lavender tile (the placeholder until real food photography exists).
 */
export function FoodThumb({
  photoId,
  emoji,
  size = 52,
  radius = 16,
  className = "",
}: {
  photoId?: string;
  emoji: string;
  size?: number;
  radius?: number;
  className?: string;
}) {
  const url = useMealPhoto(photoId);
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden bg-linear-to-br from-violet-50 to-violet-100 ${className}`}
      style={{ width: size, height: size, borderRadius: radius }}
      aria-hidden="true"
    >
      {url ? (
        // Object URL from the device; next/image can't optimize it
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.5) }} className="leading-none">
          {emoji}
        </span>
      )}
    </span>
  );
}

/** A dish tile for recipe cards: a larger emoji on a lit lavender surface. */
export function DishTile({ emoji, className = "" }: { emoji: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative grid place-items-center overflow-hidden bg-[radial-gradient(120%_90%_at_30%_20%,var(--color-white),var(--color-violet-100)_60%,var(--color-violet-200))] ${className}`}
    >
      <span className="text-[44px] leading-none drop-shadow-[0_6px_10px_rgb(69_39_176/0.18)]">{emoji}</span>
    </span>
  );
}
