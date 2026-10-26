/**
 * Simple home recipes that suit these medicines: protein first, gentle on the stomach, small
 * portions that still nourish. Persian home cooking where possible.
 *
 * PENDING DIETITIAN REVIEW: recipes, portions and the nutrients per serving (approximate,
 * calculated from typical ingredient values).
 */

import type { Nutrients } from "./nutrition";

export type RecipeTag = "protein" | "gentle" | "fiber" | "breakfast" | "quick" | "small";

export const RECIPE_TAGS: { value: RecipeTag; label: string; line: string }[] = [
  { value: "protein", label: "پرپروتئین", line: "برای حفظ عضله‌ها" },
  { value: "gentle", label: "سبک برای معده", line: "روزهای تهوع و دل‌درد" },
  { value: "fiber", label: "پرفیبر", line: "برای یبوست" },
  { value: "small", label: "حجم کم، پرمغذی", line: "وقتی اشتها نداری" },
  { value: "breakfast", label: "صبحانه", line: "شروع روز با پروتئین" },
  { value: "quick", label: "زیر ۲۰ دقیقه", line: "وقتی حوصله‌ی آشپزی نیست" },
];

export const TAG_LABEL = Object.fromEntries(RECIPE_TAGS.map((t) => [t.value, t.label])) as Record<RecipeTag, string>;

export type Ingredient = { amount: number | null; unit?: string; name: string };

export type Recipe = {
  id: string;
  title: string;
  emoji: string;
  minutes: number;
  /** How many servings the amounts below make. */
  servings: number;
  tags: RecipeTag[];
  /** One line under the title. */
  summary: string;
  /** Why it suits the treatment. */
  why: string;
  perServing: Nutrients;
  ingredients: Ingredient[];
  steps: string[];
};

const n = (kcal: number, protein: number, carbs: number, fat: number, fiber: number): Nutrients => ({
  kcal,
  protein,
  carbs,
  fat,
  fiber,
});

export const RECIPES: Recipe[] = [
  {
    id: "chicken-barley-soup",
    title: "سوپ مرغ و جو",
    emoji: "🍲",
    minutes: 45,
    servings: 4,
    tags: ["gentle", "protein"],
    summary: "گرم و سبک، برای روزهایی که معده‌ت حساسه.",
    why: "پروتئین مرغ توی یه غذای آبکی و کم‌چرب؛ هم سیرت می‌کنه هم معده رو اذیت نمی‌کنه.",
    perServing: n(240, 24, 24, 5, 4),
    ingredients: [
      { amount: 500, unit: "گرم", name: "سینه‌ی مرغ" },
      { amount: 0.5, unit: "پیمانه", name: "جو پرک" },
      { amount: 1, unit: "عدد", name: "پیاز متوسط" },
      { amount: 2, unit: "عدد", name: "هویج" },
      { amount: 1, unit: "قاشق غذاخوری", name: "روغن زیتون" },
      { amount: 6, unit: "پیمانه", name: "آب" },
      { amount: 1, unit: "عدد", name: "لیمو ترش" },
      { amount: null, name: "جعفری خردشده، نمک و فلفل" },
    ],
    steps: [
      "پیاز رو ریز خرد کن و با روغن روی حرارت ملایم تفت بده تا نرم بشه.",
      "مرغ، جو و آب رو اضافه کن و بذار حدود ۳۰ دقیقه با شعله‌ی کم بپزه.",
      "مرغ رو دربیار، ریش‌ریش کن و با هویج رنده‌شده برگردون توی قابلمه.",
      "ده دقیقه‌ی دیگه بپزه. آخر کار آب لیمو، جعفری و کمی نمک بزن.",
    ],
  },
  {
    id: "narges",
    title: "نرگسی اسفناج",
    emoji: "🍳",
    minutes: 15,
    servings: 2,
    tags: ["breakfast", "protein", "quick"],
    summary: "صبحانه‌ی ایرانی با تخم‌مرغ و اسفناج.",
    why: "دو تا تخم‌مرغ یعنی پروتئین خوب برای شروع روز، و اسفناج کمی فیبر هم اضافه می‌کنه.",
    perServing: n(210, 14, 7, 14, 3),
    ingredients: [
      { amount: 4, unit: "عدد", name: "تخم‌مرغ" },
      { amount: 300, unit: "گرم", name: "اسفناج" },
      { amount: 1, unit: "عدد", name: "پیاز کوچیک" },
      { amount: 1, unit: "قاشق غذاخوری", name: "روغن" },
      { amount: null, name: "نمک، فلفل و زردچوبه" },
    ],
    steps: [
      "پیاز رو خلالی خرد کن و با روغن و کمی زردچوبه تفت بده.",
      "اسفناج خردشده رو اضافه کن و بذار آبش کشیده بشه.",
      "تخم‌مرغ‌ها رو روش بشکن، درش رو بذار و با حرارت ملایم بذار ببنده.",
      "با کمی نون سنگک یا نون سبوس‌دار سرو کن.",
    ],
  },
  {
    id: "joojeh-yogurt",
    title: "جوجه‌ماستی تابه‌ای",
    emoji: "🍗",
    minutes: 30,
    servings: 4,
    tags: ["protein"],
    summary: "مزه‌ی جوجه‌کباب، بی‌دردسر توی تابه.",
    why: "یکی از پرپروتئین‌ترین غذاهای سفره؛ ماست مرغ رو نرم می‌کنه و به روغن زیاد نیازی نیست.",
    perServing: n(230, 36, 5, 7, 0.5),
    ingredients: [
      { amount: 700, unit: "گرم", name: "سینه‌ی مرغ" },
      { amount: 1, unit: "پیمانه", name: "ماست" },
      { amount: 1, unit: "عدد", name: "پیاز" },
      { amount: 1, unit: "عدد", name: "لیمو ترش" },
      { amount: 2, unit: "قاشق غذاخوری", name: "زعفران دم‌کرده" },
      { amount: null, name: "نمک و فلفل" },
    ],
    steps: [
      "پیاز رو رنده کن و آبش رو با ماست، زعفران و آب لیمو قاطی کن.",
      "مرغ تکه‌شده رو دست‌کم یک ساعت توی این مخلوط بخوابون.",
      "توی تابه‌ی نچسب یا فر با حرارت متوسط بپز تا طلایی بشه.",
      "با سالاد و سبزی سرو کن؛ برنج رو کم بکش تا جا برای پروتئین بمونه.",
    ],
  },
  {
    id: "trout",
    title: "قزل‌آلای سبزی‌دار در فر",
    emoji: "🐟",
    minutes: 25,
    servings: 2,
    tags: ["protein"],
    summary: "ماهی با سبزی معطر، بدون سرخ کردن.",
    why: "ماهی پروتئین زیاد و چربی‌های مفید داره؛ پختن در فر سبک‌ترش می‌کنه.",
    perServing: n(300, 33, 4, 16, 1),
    ingredients: [
      { amount: 2, unit: "عدد", name: "ماهی قزل‌آلای کوچیک" },
      { amount: 1, unit: "پیمانه", name: "سبزی خردشده (گشنیز، جعفری، شوید)" },
      { amount: 2, unit: "حبه", name: "سیر" },
      { amount: 1, unit: "عدد", name: "لیمو ترش" },
      { amount: 1, unit: "قاشق غذاخوری", name: "روغن زیتون" },
      { amount: null, name: "نمک و فلفل" },
    ],
    steps: [
      "فر رو روی ۲۰۰ درجه گرم کن.",
      "سبزی و سیر خردشده رو با آب لیمو و کمی روغن قاطی کن و توی شکم ماهی بریز.",
      "ماهی رو روی کاغذ روغنی توی سینی بذار و حدود ۲۰ دقیقه بپز.",
      "با سالاد یا سبزیجات بخارپز سرو کن.",
    ],
  },
  {
    id: "oat-porridge",
    title: "فرنی جو دوسر و موز",
    emoji: "🥣",
    minutes: 10,
    servings: 1,
    tags: ["breakfast", "gentle", "fiber", "quick"],
    summary: "صبحانه‌ی گرم و نرم که زود آماده می‌شه.",
    why: "جو دوسر فیبر محلول داره که برای روده خوبه، و با شیر کمی پروتئین هم می‌گیری.",
    perServing: n(330, 15, 52, 7, 6),
    ingredients: [
      { amount: 0.5, unit: "پیمانه", name: "جو دوسر پرک" },
      { amount: 1, unit: "لیوان", name: "شیر کم‌چرب" },
      { amount: 0.5, unit: "عدد", name: "موز" },
      { amount: 1, unit: "قاشق غذاخوری", name: "گردو خردشده" },
      { amount: null, name: "دارچین" },
    ],
    steps: [
      "جو و شیر رو توی یه قابلمه‌ی کوچیک بریز و هم بزن تا غلیظ بشه (حدود ۵ دقیقه).",
      "موز حلقه‌شده و دارچین رو اضافه کن.",
      "با گردو سرو کن.",
    ],
  },
  {
    id: "banana-shake",
    title: "شیک موز و ماست",
    emoji: "🥤",
    minutes: 5,
    servings: 1,
    tags: ["small", "quick", "breakfast", "protein"],
    summary: "وقتی اشتها نداری، نوشیدنی‌ای که سیرت نمی‌کنه ولی مغذیه.",
    why: "نوشیدنی‌ها حتی روزهای کم‌اشتهایی راحت‌تر پایین می‌رن؛ ماست چکیده پروتئینش رو بالا می‌بره.",
    perServing: n(260, 18, 38, 5, 3),
    ingredients: [
      { amount: 1, unit: "عدد", name: "موز" },
      { amount: 0.5, unit: "پیمانه", name: "ماست یونانی (چکیده)" },
      { amount: 0.5, unit: "لیوان", name: "شیر کم‌چرب" },
      { amount: 1, unit: "قاشق چای‌خوری", name: "عسل (اختیاری)" },
      { amount: null, name: "چند تکه یخ" },
    ],
    steps: [
      "همه‌ی مواد رو توی مخلوط‌کن بریز.",
      "بزن تا یکدست بشه.",
      "آروم و جرعه‌جرعه بنوش؛ لازم نیست یه‌جا تمومش کنی.",
    ],
  },
  {
    id: "kateh-chicken",
    title: "کته و مرغ آب‌پز",
    emoji: "🍚",
    minutes: 40,
    servings: 2,
    tags: ["gentle", "protein"],
    summary: "ساده‌ترین غذای سفره، برای روزهای تهوع یا اسهال.",
    why: "برنج ساده و مرغ بی‌روغن از سبک‌ترین غذاها برای معده‌ان و پروتئین رو هم کنار نمی‌ذارن.",
    perServing: n(380, 30, 48, 6, 1),
    ingredients: [
      { amount: 1, unit: "پیمانه", name: "برنج" },
      { amount: 250, unit: "گرم", name: "سینه‌ی مرغ" },
      { amount: 1, unit: "عدد", name: "پیاز کوچیک" },
      { amount: null, name: "نمک" },
    ],
    steps: [
      "مرغ رو با پیاز و کمی نمک توی آب بذار تا بپزه (حدود ۲۵ دقیقه).",
      "برنج رو با کمی از آب مرغ کته کن؛ بدون روغن یا با خیلی کم.",
      "مرغ رو ریش‌ریش کن و کنار کته سرو کن.",
      "اگه حالت تهوع داری، بذار کمی خنک بشه؛ غذای ولرم بوی کمتری داره.",
    ],
  },
  {
    id: "adasi",
    title: "عدسی ساده",
    emoji: "🍲",
    minutes: 40,
    servings: 4,
    tags: ["fiber", "breakfast"],
    summary: "صبحانه یا شام گرم و پرفیبر.",
    why: "عدس هم پروتئین گیاهی داره هم فیبر زیاد؛ برای یبوست کمک خوبیه، به شرط اینکه آب هم بنوشی.",
    perServing: n(220, 13, 34, 4, 9),
    ingredients: [
      { amount: 1.5, unit: "پیمانه", name: "عدس" },
      { amount: 1, unit: "عدد", name: "پیاز" },
      { amount: 1, unit: "عدد", name: "سیب‌زمینی کوچیک" },
      { amount: 5, unit: "پیمانه", name: "آب" },
      { amount: 1, unit: "قاشق غذاخوری", name: "روغن" },
      { amount: null, name: "گلپر و نمک" },
    ],
    steps: [
      "عدس رو بشور و یکی دو ساعت خیس کن؛ نفخش رو کمتر می‌کنه.",
      "با آب و سیب‌زمینی خردشده بذار بپزه تا نرم بشه.",
      "پیاز داغ کم‌روغن درست کن و اضافه کن.",
      "با گلپر و کمی نمک سرو کن.",
    ],
  },
  {
    id: "kashk-light",
    title: "کشک بادمجان سبک",
    emoji: "🍆",
    minutes: 50,
    servings: 4,
    tags: ["fiber"],
    summary: "همون مزه‌ی آشنا، با بادمجان کبابی به‌جای سرخ‌کرده.",
    why: "بادمجان سرخ‌کرده روغن زیادی می‌کشه و معده رو سنگین می‌کنه؛ کبابی‌ش سبک‌تر و پرفیبره.",
    perServing: n(190, 9, 18, 9, 7),
    ingredients: [
      { amount: 4, unit: "عدد", name: "بادمجان" },
      { amount: 0.5, unit: "پیمانه", name: "کشک" },
      { amount: 1, unit: "عدد", name: "پیاز" },
      { amount: 2, unit: "حبه", name: "سیر" },
      { amount: 1, unit: "قاشق غذاخوری", name: "روغن" },
      { amount: null, name: "نعنا خشک و کمی گردو" },
    ],
    steps: [
      "بادمجان‌ها رو توی فر یا روی شعله کبابی کن و پوستشون رو بگیر.",
      "پیاز و سیر رو با یه قاشق روغن تفت بده.",
      "بادمجان رو اضافه کن و له کن، بعد کشک رو قاطی کن و بذار جا بیفته.",
      "روش نعنا داغ کم‌روغن و کمی گردو بریز.",
    ],
  },
  {
    id: "chicken-salad",
    title: "سالاد مرغ و ماست",
    emoji: "🥗",
    minutes: 15,
    servings: 2,
    tags: ["protein", "quick"],
    summary: "ناهار سریع با مرغ پخته‌ی دیروز.",
    why: "مرغ و ماست چکیده با هم پروتئین زیادی می‌دن، و سبزیجاتش فیبر و خنکی می‌آرن.",
    perServing: n(260, 30, 10, 11, 3),
    ingredients: [
      { amount: 250, unit: "گرم", name: "مرغ پخته" },
      { amount: 0.5, unit: "پیمانه", name: "ماست یونانی (چکیده)" },
      { amount: 1, unit: "عدد", name: "خیار" },
      { amount: 1, unit: "ساقه", name: "کرفس" },
      { amount: 0.5, unit: "پیمانه", name: "نخودفرنگی پخته" },
      { amount: null, name: "آب لیمو، شوید و نمک" },
    ],
    steps: [
      "مرغ پخته رو ریش‌ریش یا مکعبی خرد کن.",
      "خیار و کرفس رو ریز خرد کن و با نخودفرنگی قاطی کن.",
      "ماست، آب لیمو، شوید و کمی نمک رو اضافه کن و هم بزن.",
      "با نون سبوس‌دار یا لای برگ کاهو بخور.",
    ],
  },
  {
    id: "lentil-salad",
    title: "سالاد عدس",
    emoji: "🫘",
    minutes: 15,
    servings: 2,
    tags: ["fiber", "quick"],
    summary: "رنگی و ترد، با عدس پخته.",
    why: "یه کاسه‌اش نزدیک نصف فیبر روزانه‌ته؛ اگه تازه فیبرت رو زیاد می‌کنی، از نصف پرس شروع کن.",
    perServing: n(240, 13, 32, 7, 11),
    ingredients: [
      { amount: 1.5, unit: "پیمانه", name: "عدس پخته" },
      { amount: 1, unit: "عدد", name: "گوجه‌فرنگی" },
      { amount: 1, unit: "عدد", name: "خیار" },
      { amount: 0.5, unit: "عدد", name: "پیاز قرمز" },
      { amount: 1, unit: "قاشق غذاخوری", name: "روغن زیتون" },
      { amount: null, name: "آب لیمو، جعفری و نمک" },
    ],
    steps: [
      "سبزیجات رو ریز خرد کن.",
      "با عدس پخته‌ی خنک قاطی کن.",
      "روغن زیتون، آب لیمو، جعفری و کمی نمک بزن.",
      "کنارش یه لیوان آب بنوش؛ فیبر بدون آب یبوست رو بدتر می‌کنه.",
    ],
  },
  {
    id: "yogurt-bowl",
    title: "کاسه‌ی ماست و میوه",
    emoji: "🍓",
    minutes: 5,
    servings: 1,
    tags: ["breakfast", "quick", "protein", "small"],
    summary: "پنج دقیقه‌ای، برای صبحانه یا عصرونه.",
    why: "ماست چکیده تقریباً دو برابر ماست معمولی پروتئین داره و حجمش کمه.",
    perServing: n(280, 20, 30, 9, 4),
    ingredients: [
      { amount: 1, unit: "پیمانه", name: "ماست یونانی (چکیده)" },
      { amount: 0.5, unit: "پیمانه", name: "میوه‌ی خردشده (توت‌فرنگی، سیب یا موز)" },
      { amount: 1, unit: "قاشق غذاخوری", name: "گردو خردشده" },
      { amount: 1, unit: "قاشق چای‌خوری", name: "تخم شربتی یا چیا" },
    ],
    steps: [
      "ماست رو توی کاسه بریز.",
      "میوه، گردو و تخم شربتی رو روش بریز.",
      "اگه شیرینی می‌خوای، یه قاشق چای‌خوری عسل کافیه.",
    ],
  },
];

export function findRecipe(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}

export function recipesTagged(tag: RecipeTag): Recipe[] {
  return RECIPES.filter((r) => r.tags.includes(tag));
}
