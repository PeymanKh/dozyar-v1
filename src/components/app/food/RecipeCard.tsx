import Link from "next/link";
import { DishTile } from "./FoodThumb";
import { Clock } from "@/components/ui/icons";
import { toFaDigits } from "@/lib/digits";
import { formatGrams } from "@/lib/nutrition";
import type { Recipe } from "@/lib/recipes";

/**
 * A recipe as a card: the dish, its name, how long it takes and its protein per serving (the
 * number people choose by on these medicines). `shelf` sizes it for a sideways row.
 */
export function RecipeCard({ recipe, shelf = false }: { recipe: Recipe; shelf?: boolean }) {
  return (
    <Link
      href={`/food/recipes/${recipe.id}`}
      className={`group flex flex-col gap-2.5 transition-transform active:scale-[0.97] ${
        shelf ? "w-[156px] shrink-0 snap-start" : "min-w-0"
      }`}
    >
      <DishTile emoji={recipe.emoji} className="aspect-[4/3] w-full rounded-[22px] border border-violet-100" />
      <span className="px-0.5">
        <span className="line-clamp-2 text-label text-text-primary">{recipe.title}</span>
        <span className="mt-0.5 flex items-center gap-1 text-caption-small text-text-secondary">
          <Clock size={12} className="shrink-0" />
          {toFaDigits(recipe.minutes)} دقیقه، {formatGrams(recipe.perServing.protein)} گرم پروتئین
        </span>
      </span>
    </Link>
  );
}
