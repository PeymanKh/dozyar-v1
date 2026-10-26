"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FoodThumb } from "@/components/app/food/FoodThumb";
import { DatePill, TimePill } from "@/components/app/WhenPills";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ChevronBack, Minus, Plus, Search, Sparkles, Trash } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { TextField } from "@/components/ui/TextField";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import {
  logMeal,
  removeMeal,
  restoreMeal,
  saveMeal,
  useAppData,
  type MealItem,
  type MealLog,
} from "@/lib/app-store";
import { analyzeMealPhoto } from "@/lib/food-ai";
import { FOOD_GROUPS, FOODS, itemOf, nextAmount, searchFoods, type Food, type FoodGroup } from "@/lib/foods";
import { isoOf } from "@/lib/jalali";
import { saveMealPhoto, shrinkPhoto, useMealPhoto } from "@/lib/meal-photos";
import {
  clockNow,
  formatAmount,
  formatGrams,
  formatKcal,
  itemNutrients,
  MEAL_TYPES,
  mealNutrients,
  mealTypeAt,
  type MealType,
} from "@/lib/nutrition";
import { haptic, toast, useMealDraft, type MealDraft } from "@/lib/ui-store";

/**
 * Logging a meal, in one sheet: a photo is recognised first (a short scan over the picture),
 * then everything found is shown with its amount and nutrients, ready to correct: change an
 * amount, remove an item, add one from the food list. Without a photo, it starts at the food
 * list. A meal already logged opens here too, to change or delete.
 * The numbers are estimates and the sheet says so; the person always has the last word.
 */
export function MealSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const draft = useMealDraft();
  return (
    <Sheet open={open} onClose={onClose} title={draft?.kind === "edit" ? "وعده" : "ثبت غذا"}>
      {open && draft ? <MealFlow key={draft.seq} draft={draft} onDone={onClose} /> : null}
    </Sheet>
  );
}

type Phase = "analyzing" | "review" | "search";

function MealFlow({ draft, onDone }: { draft: MealDraft; onDone: () => void }) {
  const { meals } = useAppData();
  const [existing] = useState<MealLog | undefined>(() =>
    draft.kind === "edit" ? meals.find((m) => m.id === draft.mealId) : undefined,
  );
  const [now] = useState(() => new Date());
  const today = isoOf(now);
  const photo = draft.kind === "photo" ? draft.photo : null;

  const [phase, setPhase] = useState<Phase>(draft.kind === "photo" ? "analyzing" : existing ? "review" : "search");
  const [items, setItems] = useState<MealItem[]>(existing?.items ?? []);
  const [title, setTitle] = useState<string | undefined>(existing?.title);
  const [date, setDate] = useState(existing?.date ?? today);
  const [time, setTime] = useState(existing?.time ?? clockNow(now));
  const [type, setType] = useState<MealType>(existing?.type ?? mealTypeAt(clockNow(now)));
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  // The photo being looked at: the new one, or the saved one of a logged meal.
  const newUrl = useObjectUrl(photo);
  const savedUrl = useMealPhoto(existing?.photoId);
  const photoUrl = newUrl ?? savedUrl;

  // Scale the photo down for storage while the analysis runs.
  const small = useRef<Promise<Blob> | null>(null);
  useEffect(() => {
    if (!photo) return;
    small.current = shrinkPhoto(photo);
    let alive = true;
    analyzeMealPhoto(photo, mealTypeAt(clockNow(new Date())))
      .then((guess) => {
        if (!alive) return;
        setItems(guess.items);
        setTitle(guess.title);
        setPhase("review");
        haptic(8);
      })
      .catch(() => alive && setPhase("search"));
    return () => {
      alive = false;
    };
  }, [photo]);

  if (draft.kind === "edit" && !existing) {
    return <p className="pb-4 text-center text-body-small text-text-secondary">این وعده دیگه وجود نداره.</p>;
  }

  function addFood(food: Food) {
    setItems((list) => {
      const at = list.findIndex((i) => i.foodId === food.id);
      if (at >= 0) return list.map((i, k) => (k === at ? { ...i, amount: nextAmount(i.amount, 1) } : i));
      return [...list, itemOf(food, 1)];
    });
    setAdded(food.id);
    setTimeout(() => setAdded(null), 1400);
    setPhase("review");
  }

  async function save() {
    if (!items.length || saving) return;
    setSaving(true);
    let photoId = existing?.photoId;
    if (photo) {
      try {
        photoId = await saveMealPhoto(await (small.current ?? shrinkPhoto(photo)));
      } catch {
        photoId = undefined; // the meal still counts without its picture
      }
    }
    const fields = {
      date,
      time,
      type,
      title: title ?? (items.length === 1 ? items[0].name : undefined),
      items,
      photoId,
    };
    if (existing) {
      saveMeal({ ...existing, ...fields });
      toast("وعده به‌روز شد", { label: "برگردون", run: () => saveMeal(existing) });
    } else {
      const meal = logMeal({ ...fields, source: photo ? "photo" : "manual" });
      toast(`${MEAL_TYPES.find((m) => m.value === type)!.label} ثبت شد`, {
        label: "برگردون",
        run: () => removeMeal(meal.id),
      });
    }
    haptic(12);
    onDone();
  }

  function remove() {
    if (!existing) return;
    removeMeal(existing.id);
    toast("وعده حذف شد", { label: "برگردون", run: () => restoreMeal(existing) });
    onDone();
  }

  if (phase === "analyzing") return <Analyzing url={photoUrl} />;

  if (phase === "search") {
    return (
      <FoodSearch
        onPick={addFood}
        onBack={items.length ? () => setPhase("review") : undefined}
        photoUrl={photoUrl}
      />
    );
  }

  const total = mealNutrients({ items });

  return (
    <div className="flex flex-col gap-5">
      {photoUrl ? (
        <div className="relative -mt-1 overflow-hidden rounded-[22px] bg-violet-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="عکس غذا" className="aspect-[2/1] w-full object-cover" />
          {draft.kind === "photo" ? (
            <span className="absolute start-3 bottom-3 flex h-8 items-center gap-1.5 rounded-full bg-ink-900/55 px-3 text-caption-small text-white backdrop-blur-md">
              <Sparkles size={13} />
              تشخیص هوشمند
            </span>
          ) : null}
        </div>
      ) : null}

      <div>
        <h3 className="text-title-section text-text-primary">{title ?? "وعده‌ی تو"}</h3>
        <p className="text-caption text-pretty text-text-secondary">
          {draft.kind === "photo"
            ? "مقدارها تخمینی‌ان؛ اگه چیزی درست نیست، اصلاحش کن."
            : "مقدار هر خوراکی رو با − و + تنظیم کن."}
        </p>
      </div>

      <ul className="-mt-1 flex flex-col divide-y divide-violet-100" aria-label="خوراکی‌های این وعده">
        <AnimatePresence initial={false}>
          {items.map((item, k) => (
            <motion.li
              key={item.foodId ?? `${item.name}-${k}`}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="overflow-hidden"
            >
              <ItemRow
                item={item}
                highlight={item.foodId === added}
                onAmount={(amount) =>
                  setItems((list) =>
                    amount > 0 ? list.map((i, j) => (j === k ? { ...i, amount } : i)) : list.filter((_, j) => j !== k),
                  )
                }
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <button
        type="button"
        onClick={() => setPhase("search")}
        className="-mt-3 flex h-12 items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-dashed border-violet-300 text-label text-text-brand transition-colors active:bg-surface-brand-subtle"
      >
        <Plus size={18} />
        افزودن خوراکی
      </button>

      {items.length ? <Totals total={total} /> : null}

      <section aria-label="کی خوردی؟" className="flex flex-col gap-3">
        <div className="flex justify-center gap-2">
          <DatePill value={date} onChange={setDate} today={today} />
          <TimePill
            value={time}
            onChange={(t) => {
              setTime(t);
              if (!existing) setType(mealTypeAt(t));
            }}
          />
        </div>
        <Segmented<MealType> label="کدوم وعده؟" value={type} onChange={setType} options={MEAL_TYPES} />
      </section>

      <div className="sticky bottom-0 -mx-6 flex flex-col gap-1 bg-linear-to-t from-surface from-70% to-surface/0 px-6 pt-5 pb-1">
        <Button onClick={save} disabled={!items.length} loading={saving} loadingLabel="در حال ثبت">
          {existing ? "ذخیره" : "ثبت وعده"}
        </Button>
        {existing ? (
          <Button variant="plain" className="!text-danger" onClick={remove}>
            <Trash size={18} />
            حذف این وعده
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** The photo with a light passing over it while the food is recognised (Visual Look Up feel). */
function Analyzing({ url }: { url: string | null }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-5 pb-4" aria-live="polite">
      <div className="relative w-full overflow-hidden rounded-[22px] bg-violet-100">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="aspect-[16/10] w-full object-cover" />
        ) : (
          <div className="aspect-[16/10] w-full" />
        )}
        <div className="absolute inset-0 bg-violet-500/10" />
        {reduce ? (
          <motion.div
            className="absolute inset-0 bg-white/25"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        ) : (
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-0 h-1/3 bg-linear-to-b from-white/0 via-white/45 to-white/0"
            initial={{ top: "-35%" }}
            animate={{ top: "100%" }}
            transition={{ duration: 1.4, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
          />
        )}
        {/* Focus corners, like the camera finding a subject */}
        {["top-3 start-3 border-t-2 border-s-2 rounded-ss-[10px]", "top-3 end-3 border-t-2 border-e-2 rounded-se-[10px]", "bottom-3 start-3 border-b-2 border-s-2 rounded-es-[10px]", "bottom-3 end-3 border-b-2 border-e-2 rounded-ee-[10px]"].map(
          (c) => (
            <span key={c} aria-hidden="true" className={`absolute size-6 border-white/90 ${c}`} />
          ),
        )}
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="flex items-center gap-2 text-body-strong text-text-primary">
          <Spinner size={16} className="text-brand" />
          داریم غذات رو می‌شناسیم…
        </p>
        <p className="text-caption text-text-secondary">پروتئین، فیبر و انرژی‌ش رو هم حساب می‌کنیم</p>
      </div>
    </div>
  );
}

/** One food in the meal: what it is, how much, its protein, and − / + for the amount. */
function ItemRow({
  item,
  highlight,
  onAmount,
}: {
  item: MealItem;
  highlight: boolean;
  onAmount: (amount: number) => void;
}) {
  const n = itemNutrients(item);
  const atMin = item.amount <= 0.5;
  return (
    <div
      className={`flex items-center gap-3 py-3 transition-colors duration-700 ${highlight ? "bg-surface-brand-subtle/60" : ""}`}
    >
      <FoodThumb emoji={item.emoji} size={44} radius={14} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-strong text-text-primary">{item.name}</p>
        <p className="text-caption text-text-secondary">
          {formatAmount(item.amount)} {item.unit}، {formatGrams(n.protein)} گرم پروتئین
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`مقدار ${item.name}`}>
        <StepButton
          label={atMin ? `حذف ${item.name}` : "کمتر"}
          onClick={() => onAmount(atMin ? 0 : nextAmount(item.amount, -1))}
          danger={atMin}
        >
          {atMin ? <Trash size={16} /> : <Minus size={16} />}
        </StepButton>
        <span className="w-9 text-center font-display text-[15px] font-bold text-text-primary" aria-live="polite">
          {formatAmount(item.amount)}
        </span>
        <StepButton label="بیشتر" onClick={() => onAmount(nextAmount(item.amount, 1))}>
          <Plus size={16} />
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      transition={{ type: "spring", bounce: 0, duration: 0.25 }}
      className={`grid size-9 place-items-center rounded-full ${
        danger ? "bg-danger-subtle text-danger" : "bg-surface-brand-subtle text-text-brand"
      }`}
    >
      {children}
    </motion.button>
  );
}

/** What the meal adds up to: protein first, then fiber and energy, then carbs and fat. */
function Totals({ total }: { total: ReturnType<typeof mealNutrients> }) {
  const cells = [
    { label: "فیبر", value: `${formatGrams(total.fiber)} گرم` },
    { label: "انرژی", value: `${formatKcal(total.kcal)} کیلوکالری` },
    { label: "کربوهیدرات", value: `${formatGrams(total.carbs)} گرم` },
    { label: "چربی", value: `${formatGrams(total.fat)} گرم` },
  ];
  return (
    <section aria-label="جمع این وعده" className="rounded-[20px] bg-surface-brand-subtle p-4">
      <p className="text-caption text-text-secondary">جمع این وعده</p>
      <p className="flex items-baseline gap-1.5">
        <span className="font-display text-[30px] leading-tight font-bold text-text-primary">
          {formatGrams(total.protein)}
        </span>
        <span className="text-label text-text-secondary">گرم پروتئین</span>
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-violet-200/70 pt-3">
        {cells.map((c) => (
          <div key={c.label} className="flex items-baseline justify-between gap-2">
            <dt className="text-caption text-text-secondary">{c.label}</dt>
            <dd className="text-label text-text-primary">{c.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The food list: search by name, or browse by group. Tapping one adds it to the meal. */
function FoodSearch({
  onPick,
  onBack,
  photoUrl,
}: {
  onPick: (food: Food) => void;
  onBack?: () => void;
  photoUrl: string | null;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<FoodGroup | null>(null);
  const results = (query.trim() ? searchFoods(query) : FOODS).filter((f) => !group || f.group === group);

  return (
    <div className="flex flex-col gap-4">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 items-center gap-1 self-end text-label text-text-brand"
        >
          {/* Back points left, like every back in the app */}
          بازگشت به وعده
          <ChevronBack size={18} />
        </button>
      ) : photoUrl ? null : (
        <p className="text-center text-caption text-text-secondary">چی خوردی؟ اسمش رو بنویس یا از دسته‌ها پیدا کن.</p>
      )}

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="مثلاً ماست، مرغ، سنگک"
          aria-label="جستجوی خوراکی"
          className="ps-11"
          enterKeyHint="search"
        />
      </div>

      <div
        role="radiogroup"
        aria-label="دسته‌ها"
        className="-mx-6 flex gap-2 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Chip selected={group === null} onClick={() => setGroup(null)} className="shrink-0">
          همه
        </Chip>
        {FOOD_GROUPS.map((g) => (
          <Chip key={g.value} selected={group === g.value} onClick={() => setGroup(g.value)} className="shrink-0">
            {g.label}
          </Chip>
        ))}
      </div>

      <ul className="flex flex-col divide-y divide-violet-100 pb-2" aria-label="خوراکی‌ها">
        {results.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => onPick(f)}
              className="flex w-full items-center gap-3 py-2.5 text-start transition-colors active:bg-surface-brand-subtle"
            >
              <FoodThumb emoji={f.emoji} size={40} radius={12} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-strong text-text-primary">{f.name}</span>
                <span className="block text-caption text-text-secondary">
                  هر {f.unit}: {formatGrams(f.per.protein)} گرم پروتئین، {formatKcal(f.per.kcal)} کیلوکالری
                </span>
              </span>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-brand-subtle text-text-brand">
                <Plus size={16} />
              </span>
            </button>
          </li>
        ))}
        {!results.length ? (
          <li className="py-8 text-center text-caption text-text-secondary">
            چیزی پیدا نشد. یه اسم دیگه امتحان کن، مثلاً «مرغ» یا «ماست».
          </li>
        ) : null}
      </ul>
    </div>
  );
}
