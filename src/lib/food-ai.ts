/**
 * Recognizing a meal from its photo.
 *
 * MOCK: there is no vision model yet. This waits like a network call and then picks a
 * believable Iranian meal for the time of day, the same one for the same photo, so the review
 * screen (items, portions, corrections) can be designed and tested. Replace with a call to the
 * Django API, which sends the photo to a vision model and returns the same shape: a title and
 * items from the food list with an amount each. With a real model the photo leaves the phone,
 * so the wording on the review screen («فقط روی گوشی‌ت») must change with it.
 */

import type { MealItem } from "./app-store";
import { findFood, itemOf } from "./foods";
import type { MealType } from "./nutrition";

export type MealGuess = { title: string; items: MealItem[] };

type Scenario = { title: string; items: [foodId: string, amount: number][]; meals: MealType[] };

const SCENARIOS: Scenario[] = [
  { title: "نون و پنیر و گردو", items: [["sangak", 2], ["cheese", 1], ["walnut", 2]], meals: ["breakfast"] },
  { title: "املت گوجه", items: [["omelet", 1], ["barbari", 1]], meals: ["breakfast", "dinner"] },
  { title: "تخم‌مرغ آب‌پز و نون", items: [["egg", 2], ["sangak", 1], ["sabzi", 1]], meals: ["breakfast"] },
  { title: "فرنی جو دوسر و موز", items: [["oats", 1], ["banana", 0.5]], meals: ["breakfast"] },
  { title: "حلیم", items: [["haleem", 1]], meals: ["breakfast"] },
  { title: "عدسی", items: [["adasi", 1], ["sangak", 1]], meals: ["breakfast", "dinner"] },
  { title: "چلو مرغ", items: [["polo", 2], ["chicken", 1], ["shirazi", 1]], meals: ["lunch", "dinner"] },
  { title: "چلو کباب کوبیده", items: [["polo", 2], ["koobideh", 2], ["doogh", 1]], meals: ["lunch", "dinner"] },
  { title: "جوجه‌کباب با سالاد", items: [["joojeh", 1], ["polo", 1.5], ["salad", 1]], meals: ["lunch", "dinner"] },
  { title: "قورمه‌سبزی با برنج", items: [["ghormeh", 1], ["polo", 2]], meals: ["lunch", "dinner"] },
  { title: "قیمه با برنج", items: [["gheymeh", 1], ["polo", 2]], meals: ["lunch", "dinner"] },
  { title: "عدس‌پلو و ماست", items: [["adaspolo", 1], ["yogurt", 1]], meals: ["lunch", "dinner"] },
  { title: "ماکارونی و سالاد", items: [["macaroni", 1], ["salad", 1]], meals: ["lunch", "dinner"] },
  { title: "ماهی و برنج", items: [["fish", 1], ["polo", 1.5], ["sabzi", 1]], meals: ["lunch", "dinner"] },
  { title: "کشک بادمجان و نون", items: [["kashk", 1], ["lavash", 1]], meals: ["lunch", "dinner"] },
  { title: "آش رشته", items: [["ash", 1]], meals: ["lunch", "dinner", "snack"] },
  { title: "کتلت و سالاد شیرازی", items: [["kotlet", 2], ["lavash", 1], ["shirazi", 1]], meals: ["lunch", "dinner"] },
  { title: "ماست و خیار", items: [["mastkhiar", 1]], meals: ["snack"] },
  { title: "موز و بادام", items: [["banana", 1], ["almonds", 0.5]], meals: ["snack"] },
  { title: "سیب و پرتقال", items: [["apple", 1], ["orange", 1]], meals: ["snack"] },
  { title: "خرما و گردو", items: [["dates", 3], ["walnut", 2]], meals: ["snack", "breakfast"] },
  { title: "ماست یونانی و موز", items: [["greek", 1], ["banana", 0.5]], meals: ["snack", "breakfast"] },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A small fingerprint of the photo: its size and a sample of its bytes. */
async function fingerprint(photo: Blob): Promise<number> {
  let h = photo.size | 0;
  try {
    const bytes = new Uint8Array(await photo.slice(0, 4096).arrayBuffer());
    for (let i = 0; i < bytes.length; i += 7) h = (Math.imul(h, 31) + bytes[i]) | 0;
  } catch {
    // unreadable; the size alone will do
  }
  return Math.abs(h);
}

export async function analyzeMealPhoto(photo: Blob, meal: MealType): Promise<MealGuess> {
  const [seed] = await Promise.all([fingerprint(photo), wait(1700)]);
  const fitting = SCENARIOS.filter((s) => s.meals.includes(meal));
  const pick = fitting[seed % fitting.length];
  return {
    title: pick.title,
    items: pick.items.flatMap(([id, amount]) => {
      const food = findFood(id);
      return food ? [itemOf(food, amount)] : [];
    }),
  };
}
