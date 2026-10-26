"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { RecipeCard } from "./RecipeCard";
import { AppHeader } from "@/components/app/AppHeader";
import { Screen } from "@/components/app/Screen";
import { Chip } from "@/components/ui/Chip";
import { toFaDigits } from "@/lib/digits";
import { RECIPE_TAGS, RECIPES, type RecipeTag } from "@/lib/recipes";

/** Every recipe, filtered by what it is good for; opens on ?tag= when a link asks for one. */
export function RecipesScreen() {
  const params = useSearchParams();
  const asked = params.get("tag");
  const initial = RECIPE_TAGS.some((t) => t.value === asked) ? (asked as RecipeTag) : null;
  const [tag, setTag] = useState<RecipeTag | null>(initial);
  const list = tag ? RECIPES.filter((r) => r.tags.includes(tag)) : RECIPES;
  const line = RECIPE_TAGS.find((t) => t.value === tag)?.line;

  return (
    <Screen pushed>
      <AppHeader title="دستور پخت" caption="ساده، خونگی و مناسب درمانت" back />

      <div className="flex flex-col gap-4 px-4">
        <div
          role="radiogroup"
          aria-label="نوع دستور"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Chip selected={tag === null} onClick={() => setTag(null)} className="shrink-0">
            همه
          </Chip>
          {RECIPE_TAGS.map((t) => (
            <Chip key={t.value} selected={tag === t.value} onClick={() => setTag(t.value)} className="shrink-0">
              {t.label}
            </Chip>
          ))}
        </div>
        <p className="-mt-1 px-1 text-caption text-text-secondary" aria-live="polite">
          {toFaDigits(list.length)} دستور{line ? `، ${line}` : ""}
        </p>

        <div className="grid grid-cols-2 gap-x-3 gap-y-5">
          {list.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </div>
    </Screen>
  );
}
