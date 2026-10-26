"use client";

import { openMeal, registerMealInput } from "@/lib/ui-store";

/**
 * The hidden photo input behind every «عکس غذا» button (see pickMealPhoto). On a phone it offers
 * the camera or the photo library; a chosen photo opens the meal sheet to be recognised.
 */
export function MealCamera() {
  return (
    <input
      ref={registerMealInput}
      type="file"
      accept="image/*"
      className="hidden"
      aria-hidden="true"
      tabIndex={-1}
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) openMeal({ kind: "photo", photo: file });
      }}
    />
  );
}
