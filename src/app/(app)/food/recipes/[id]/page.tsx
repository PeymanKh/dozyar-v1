import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeScreen } from "@/components/app/food/RecipeScreen";
import { findRecipe, RECIPES } from "@/lib/recipes";

// Device data only: see the note in (app)/layout.tsx.
export const instant = false;

export function generateStaticParams() {
  return RECIPES.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: PageProps<"/food/recipes/[id]">): Promise<Metadata> {
  const recipe = findRecipe((await params).id);
  return { title: recipe ? `${recipe.title} | دوزیار` : "دستور پخت | دوزیار" };
}

export default async function Page({ params }: PageProps<"/food/recipes/[id]">) {
  const { id } = await params;
  if (!findRecipe(id)) notFound();
  return <RecipeScreen id={id} />;
}
