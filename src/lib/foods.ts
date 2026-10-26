/**
 * Foods people log, with the unit Iranians actually count in («کفگیر»، «کف دست»، «قوطی کبریت»)
 * and nutrients per one of that unit. Used to correct what the photo analysis found, to add
 * food by hand, and by the mock analysis itself.
 *
 * PENDING DIETITIAN REVIEW: values are approximate averages for home-cooked Iranian portions
 * (USDA-style references, typical oil and portion sizes). They are estimates and are shown
 * to people as estimates.
 */

import type { MealItem } from "./app-store";
import type { Nutrients } from "./nutrition";
import { compact } from "./text";

export type FoodGroup = "dish" | "protein" | "bread" | "dairy" | "veg" | "fruit" | "snack" | "drink";

export const FOOD_GROUPS: { value: FoodGroup; label: string }[] = [
  { value: "dish", label: "غذا" },
  { value: "protein", label: "پروتئین" },
  { value: "bread", label: "نان و غلات" },
  { value: "dairy", label: "لبنیات" },
  { value: "veg", label: "سبزی و سالاد" },
  { value: "fruit", label: "میوه" },
  { value: "snack", label: "تنقلات" },
  { value: "drink", label: "نوشیدنی" },
];

export type Food = {
  id: string;
  name: string;
  emoji: string;
  /** What one of means: «کفگیر»، «عدد»، «کاسه». */
  unit: string;
  group: FoodGroup;
  /** Per one unit. */
  per: Nutrients;
  /** Other names people type. */
  aliases?: string[];
};

const n = (kcal: number, protein: number, carbs: number, fat: number, fiber: number): Nutrients => ({
  kcal,
  protein,
  carbs,
  fat,
  fiber,
});

export const FOODS: Food[] = [
  // Dishes
  { id: "polo", name: "برنج (پلو)", emoji: "🍚", unit: "کفگیر", group: "dish", per: n(160, 3, 30, 3.5, 0.5), aliases: ["برنج", "چلو", "پلو", "کته"] },
  { id: "ghormeh", name: "خورش قورمه‌سبزی", emoji: "🥘", unit: "کاسه", group: "dish", per: n(320, 20, 15, 20, 6), aliases: ["قورمه سبزی", "قورمه"] },
  { id: "gheymeh", name: "خورش قیمه", emoji: "🥘", unit: "کاسه", group: "dish", per: n(340, 18, 24, 19, 5), aliases: ["قیمه"] },
  { id: "adaspolo", name: "عدس‌پلو", emoji: "🍛", unit: "بشقاب", group: "dish", per: n(480, 15, 80, 11, 9) },
  { id: "loobiapolo", name: "لوبیاپلو", emoji: "🍛", unit: "بشقاب", group: "dish", per: n(520, 20, 70, 17, 6) },
  { id: "macaroni", name: "ماکارونی", emoji: "🍝", unit: "بشقاب", group: "dish", per: n(520, 22, 65, 18, 4), aliases: ["پاستا"] },
  { id: "ash", name: "آش رشته", emoji: "🍲", unit: "کاسه", group: "dish", per: n(280, 11, 42, 8, 8), aliases: ["آش"] },
  { id: "adasi", name: "عدسی", emoji: "🍲", unit: "کاسه", group: "dish", per: n(210, 12, 33, 3.5, 8) },
  { id: "haleem", name: "حلیم", emoji: "🥣", unit: "کاسه", group: "dish", per: n(320, 17, 42, 9, 4) },
  { id: "soup", name: "سوپ جو", emoji: "🍲", unit: "کاسه", group: "dish", per: n(190, 9, 27, 5, 4), aliases: ["سوپ"] },
  { id: "kashk", name: "کشک بادمجان", emoji: "🍆", unit: "کاسه", group: "dish", per: n(260, 9, 18, 17, 7) },
  { id: "kotlet", name: "کتلت", emoji: "🧆", unit: "عدد", group: "dish", per: n(170, 8, 10, 11, 1) },
  { id: "omelet", name: "املت گوجه", emoji: "🍳", unit: "بشقاب", group: "dish", per: n(230, 13, 8, 16, 2), aliases: ["املت"] },
  { id: "pizza", name: "پیتزا", emoji: "🍕", unit: "برش", group: "dish", per: n(285, 12, 36, 10, 2.5) },
  { id: "sandwich", name: "ساندویچ", emoji: "🥪", unit: "عدد", group: "dish", per: n(420, 18, 42, 19, 3), aliases: ["الویه"] },
  { id: "burger", name: "همبرگر", emoji: "🍔", unit: "عدد", group: "dish", per: n(500, 25, 40, 25, 2) },
  { id: "fries", name: "سیب‌زمینی سرخ‌کرده", emoji: "🍟", unit: "بشقاب کوچیک", group: "dish", per: n(310, 3.5, 41, 15, 3.8) },

  // Protein
  { id: "chicken", name: "مرغ", emoji: "🍗", unit: "تکه", group: "protein", per: n(220, 32, 1, 9, 0), aliases: ["سینه مرغ", "ران مرغ"] },
  { id: "joojeh", name: "جوجه‌کباب", emoji: "🍗", unit: "سیخ", group: "protein", per: n(200, 33, 2, 6, 0), aliases: ["جوجه"] },
  { id: "koobideh", name: "کباب کوبیده", emoji: "🍖", unit: "سیخ", group: "protein", per: n(250, 16, 2, 20, 0), aliases: ["کباب", "کوبیده"] },
  { id: "meat", name: "گوشت قرمز", emoji: "🥩", unit: "تکه", group: "protein", per: n(250, 26, 0, 16, 0), aliases: ["گوشت"] },
  { id: "fish", name: "ماهی", emoji: "🐟", unit: "تکه", group: "protein", per: n(220, 32, 0, 10, 0), aliases: ["قزل آلا", "سالمون"] },
  { id: "tuna", name: "تن ماهی", emoji: "🥫", unit: "قوطی", group: "protein", per: n(240, 30, 0, 13, 0), aliases: ["تن"] },
  { id: "egg", name: "تخم‌مرغ آب‌پز", emoji: "🥚", unit: "عدد", group: "protein", per: n(78, 6.3, 0.6, 5.3, 0), aliases: ["تخم مرغ"] },
  { id: "friedegg", name: "نیمرو", emoji: "🍳", unit: "عدد", group: "protein", per: n(90, 6.3, 0.4, 7, 0) },
  { id: "lentils", name: "عدس پخته", emoji: "🫘", unit: "کاسه کوچیک", group: "protein", per: n(175, 13.5, 30, 0.6, 12), aliases: ["عدس"] },
  { id: "beans", name: "لوبیا پخته", emoji: "🫘", unit: "کاسه کوچیک", group: "protein", per: n(190, 13, 34, 0.8, 10), aliases: ["لوبیا", "خوراک لوبیا"] },

  // Bread and grains
  { id: "sangak", name: "نان سنگک", emoji: "🫓", unit: "کف دست", group: "bread", per: n(100, 3.5, 20, 0.5, 2.5), aliases: ["نون سنگک", "سنگک"] },
  { id: "barbari", name: "نان بربری", emoji: "🫓", unit: "کف دست", group: "bread", per: n(110, 3.5, 22, 1, 1), aliases: ["نون بربری", "بربری"] },
  { id: "lavash", name: "نان لواش", emoji: "🫓", unit: "برگ", group: "bread", per: n(85, 2.8, 17, 0.5, 0.8), aliases: ["نون لواش", "لواش", "نان"] },
  { id: "toast", name: "نان تست", emoji: "🍞", unit: "برش", group: "bread", per: n(75, 2.5, 14, 1, 0.8), aliases: ["تست"] },
  { id: "crackers", name: "بیسکویت ساده", emoji: "🍪", unit: "عدد", group: "bread", per: n(35, 0.7, 6, 1, 0.2), aliases: ["کراکر", "بیسکوییت"] },
  { id: "oats", name: "فرنی جو دوسر", emoji: "🥣", unit: "کاسه", group: "bread", per: n(260, 12, 38, 7, 5), aliases: ["جو دوسر", "اوتمیل", "فرنی"] },
  { id: "potato", name: "سیب‌زمینی آب‌پز", emoji: "🥔", unit: "عدد", group: "bread", per: n(150, 3.4, 34, 0.2, 3), aliases: ["سیب زمینی"] },

  // Dairy
  { id: "yogurt", name: "ماست", emoji: "🥄", unit: "کاسه", group: "dairy", per: n(85, 5.5, 6.5, 2.5, 0) },
  { id: "greek", name: "ماست یونانی (چکیده)", emoji: "🥄", unit: "کاسه کوچیک", group: "dairy", per: n(120, 14, 6, 4, 0), aliases: ["ماست چکیده", "ماست پروتئینی", "ماست یونانی"] },
  { id: "mastkhiar", name: "ماست و خیار", emoji: "🥒", unit: "کاسه", group: "dairy", per: n(110, 6, 9, 5, 1) },
  { id: "milk", name: "شیر کم‌چرب", emoji: "🥛", unit: "لیوان", group: "dairy", per: n(105, 8.5, 12, 2.5, 0), aliases: ["شیر"] },
  { id: "doogh", name: "دوغ", emoji: "🥛", unit: "لیوان", group: "dairy", per: n(60, 3.5, 5, 2.5, 0) },
  { id: "cheese", name: "پنیر", emoji: "🧀", unit: "قوطی کبریت", group: "dairy", per: n(80, 5, 1, 6, 0), aliases: ["پنیر سفید"] },

  // Vegetables and salads
  { id: "shirazi", name: "سالاد شیرازی", emoji: "🥗", unit: "کاسه", group: "veg", per: n(60, 1.5, 9, 2.5, 2.5) },
  { id: "salad", name: "سالاد سبز", emoji: "🥗", unit: "کاسه", group: "veg", per: n(45, 2, 7, 1, 2.5), aliases: ["سالاد", "کاهو"] },
  { id: "sabzi", name: "سبزی خوردن", emoji: "🌿", unit: "مشت", group: "veg", per: n(10, 1, 1.5, 0.2, 1), aliases: ["سبزی"] },
  { id: "cookedveg", name: "سبزیجات پخته", emoji: "🥦", unit: "کاسه", group: "veg", per: n(60, 3, 11, 0.5, 4.5), aliases: ["سبزیجات", "بروکلی", "هویج"] },

  // Fruit
  { id: "banana", name: "موز", emoji: "🍌", unit: "عدد", group: "fruit", per: n(105, 1.3, 27, 0.4, 3.1) },
  { id: "apple", name: "سیب", emoji: "🍎", unit: "عدد", group: "fruit", per: n(95, 0.5, 25, 0.3, 4.4) },
  { id: "orange", name: "پرتقال", emoji: "🍊", unit: "عدد", group: "fruit", per: n(62, 1.2, 15, 0.2, 3.1) },
  { id: "kiwi", name: "کیوی", emoji: "🥝", unit: "عدد", group: "fruit", per: n(42, 0.8, 10, 0.4, 2.1) },
  { id: "prunes", name: "آلو خشک", emoji: "🫐", unit: "عدد", group: "fruit", per: n(20, 0.2, 5.4, 0, 0.6), aliases: ["آلو"] },
  { id: "dates", name: "خرما", emoji: "🌴", unit: "عدد", group: "fruit", per: n(23, 0.2, 6, 0, 0.6) },

  // Snacks
  { id: "walnut", name: "گردو", emoji: "🌰", unit: "عدد", group: "snack", per: n(33, 0.8, 0.7, 3.3, 0.3) },
  { id: "almonds", name: "بادام", emoji: "🥜", unit: "مشت", group: "snack", per: n(145, 5.3, 5.4, 12.5, 3) },
  { id: "sweets", name: "شیرینی", emoji: "🍰", unit: "عدد", group: "snack", per: n(170, 2, 22, 8, 0.5), aliases: ["کیک"] },
  { id: "chocolate", name: "شکلات", emoji: "🍫", unit: "تکه", group: "snack", per: n(55, 0.7, 6, 3, 0.7) },

  // Drinks
  { id: "tea", name: "چای", emoji: "☕", unit: "استکان", group: "drink", per: n(2, 0, 0.5, 0, 0) },
  { id: "sweettea", name: "چای با قند", emoji: "☕", unit: "استکان", group: "drink", per: n(22, 0, 5.5, 0, 0) },
  { id: "coffee", name: "قهوه", emoji: "☕", unit: "فنجان", group: "drink", per: n(5, 0.3, 0, 0, 0) },
  { id: "shake", name: "شیک موز و شیر", emoji: "🥤", unit: "لیوان", group: "drink", per: n(220, 12, 32, 5, 2), aliases: ["شیک", "اسموتی"] },
  { id: "juice", name: "آب‌میوه", emoji: "🧃", unit: "لیوان", group: "drink", per: n(110, 1, 26, 0.3, 0.5) },
  { id: "soda", name: "نوشابه", emoji: "🥤", unit: "قوطی", group: "drink", per: n(140, 0, 35, 0, 0) },
];

const BY_ID = new Map(FOODS.map((f) => [f.id, f]));

export function findFood(id: string): Food | undefined {
  return BY_ID.get(id);
}

/** A meal item for `amount` units of a food. */
export function itemOf(food: Food, amount = 1): MealItem {
  return { foodId: food.id, name: food.name, emoji: food.emoji, unit: food.unit, amount, per: food.per };
}

/** Foods whose name or other names contain the query (spaces and ZWNJ ignored). */
export function searchFoods(query: string): Food[] {
  const q = compact(query);
  if (!q) return FOODS;
  return FOODS.filter((f) => [f.name, ...(f.aliases ?? [])].some((name) => compact(name).includes(q)));
}

/** Amounts the stepper moves through: halves up to 3, then whole units. */
export function nextAmount(amount: number, direction: 1 | -1): number {
  const steps = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  if (direction > 0) return steps.find((s) => s > amount + 1e-9) ?? amount;
  return [...steps].reverse().find((s) => s < amount - 1e-9) ?? amount;
}
