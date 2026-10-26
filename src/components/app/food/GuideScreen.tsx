"use client";

import Link from "next/link";
import { GuideEmoji } from "./GuideGrid";
import { RecipeCard } from "./RecipeCard";
import { AppHeader } from "@/components/app/AppHeader";
import { Screen } from "@/components/app/Screen";
import { Shelf } from "@/components/app/Shelf";
import { Card, SectionTitle } from "@/components/ui/Card";
import { AlertCircle, Ban, CheckCircle, Lightbulb, Sparkles } from "@/components/ui/icons";
import { findGuide, type GuideFood } from "@/lib/food-guide";
import { recipesTagged, TAG_LABEL } from "@/lib/recipes";

/**
 * One side effect, and food for it: a reassuring line on why it happens, what usually helps,
 * what to go easy on, a few habits, when to call the doctor, recipes that suit it, and the
 * assistant for anything else. General advice, said so at the end.
 */
export function GuideScreen({ id }: { id: string }) {
  const guide = findGuide(id)!;
  const recipes = recipesTagged(guide.recipeTag);

  return (
    <Screen pushed>
      <AppHeader title={guide.title} caption="چی بخوری، چی کمتر" back />

      <div className="flex flex-col gap-4 px-4">
        <Card className="flex items-start gap-4 p-5">
          <GuideEmoji guide={guide} size={56} />
          <p className="text-body-small text-pretty text-text-primary">{guide.intro}</p>
        </Card>

        <section aria-labelledby="eat-title" className="pt-2">
          <SectionTitle id="eat-title">معمولاً کمک می‌کنه</SectionTitle>
          <FoodList foods={guide.eat} tone="eat" />
        </section>

        <section aria-labelledby="avoid-title" className="pt-2">
          <SectionTitle id="avoid-title">بهتره کمتر بخوری</SectionTitle>
          <FoodList foods={guide.avoid} tone="avoid" />
        </section>

        <section aria-labelledby="tips-title" className="pt-2">
          <SectionTitle id="tips-title">چند کار ساده</SectionTitle>
          <Card className="p-5">
            <ul className="flex flex-col gap-3">
              {guide.tips.map((t) => (
                <li key={t} className="flex items-start gap-3 text-body-small text-text-primary">
                  <Lightbulb size={18} className="mt-1 shrink-0 text-text-brand" />
                  {t}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section
          aria-labelledby="doctor-title"
          role="note"
          className="rounded-[22px] bg-danger-subtle px-5 py-4 text-text-primary"
        >
          <h2 id="doctor-title" className="flex items-center gap-2 text-body-strong">
            <AlertCircle size={18} className="shrink-0 text-danger" />
            کی با پزشک تماس بگیری
          </h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 ps-5 text-body-small marker:text-danger">
            {guide.doctor.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>

        {recipes.length ? (
          <section aria-labelledby="guide-recipes" className="pt-2">
            <SectionTitle id="guide-recipes" href={`/food/recipes?tag=${guide.recipeTag}`}>
              دستورهای {TAG_LABEL[guide.recipeTag]}
            </SectionTitle>
            <Shelf label="دستورها">
              {recipes.map((r) => (
                <RecipeCard key={r.id} recipe={r} shelf />
              ))}
            </Shelf>
          </section>
        ) : null}

        <Link
          href={`/chat?q=${encodeURIComponent(guide.ask)}`}
          className="mt-2 flex h-[52px] items-center justify-center gap-2 rounded-full bg-surface text-label-button text-text-brand shadow-card transition-transform active:scale-[0.97]"
        >
          <Sparkles size={18} />
          سؤال دیگه‌ای داری؟ از دستیار بپرس
        </Link>

        <p className="px-4 text-center text-caption text-balance text-text-tertiary">
          این راهنما عمومیه و جای توصیه‌ی پزشکت رو نمی‌گیره.
        </p>
      </div>
    </Screen>
  );
}

function FoodList({ foods, tone }: { foods: GuideFood[]; tone: "eat" | "avoid" }) {
  return (
    <Card className="divide-y divide-violet-100 overflow-hidden">
      {foods.map((f) => (
        <div key={f.name} className="flex items-center gap-3.5 px-4 py-3">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-linear-to-br from-violet-50 to-violet-100 text-[22px]"
          >
            {f.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body-strong text-text-primary">{f.name}</span>
            {f.why ? <span className="block text-caption text-pretty text-text-secondary">{f.why}</span> : null}
          </span>
          {tone === "eat" ? (
            <CheckCircle size={20} className="shrink-0 text-violet-400" aria-label="کمک می‌کنه" />
          ) : (
            <Ban size={20} className="shrink-0 text-text-tertiary" aria-label="کمتر" />
          )}
        </div>
      ))}
    </Card>
  );
}
