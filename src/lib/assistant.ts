/**
 * The assistant's answers.
 *
 * MOCK: there is no language model yet. Questions are matched to topics by keywords, and each
 * topic has a written answer that uses the person's own data (next injection, today's protein,
 * recent symptoms, weight). Replace `answer` with a call to the Django API once it exists; the
 * shape (text, links into the app, urgent) stays the same, and so do the rules below:
 *
 * - Never suggest, change or time a dose. Dose questions always go to the doctor.
 * - Red flags (severe pain, breathing, allergy signs, fainting) get the urgent answer first,
 *   whatever else the question says.
 * - Thoughts of self-harm get support and helplines, nothing else.
 * - General information only, with the doctor named as the one who decides.
 *
 * PENDING DOCTOR REVIEW of every answer below.
 */

import type { AppData } from "./app-store";
import { waterOn } from "./app-store";
import type { ChatLink } from "./chat-store";
import { toFaDigits } from "./digits";
import { GUIDES } from "./food-guide";
import { addDays, isoOf, relativeDay } from "./jalali";
import { dayNutrients, formatGrams, mealsOn, targetsFor, type Targets } from "./nutrition";
import type { OnboardingState } from "./onboarding-store";
import { formatKg, formatTime, medicationName, SITES } from "./plan";
import { recipesTagged, type RecipeTag } from "./recipes";
import { weightSummary, type WeightSummary } from "./stats";
import { SYMPTOM_LABEL, type SymptomId } from "./symptoms";
import { compact } from "./text";
import { doseState, suggestSite, type DoseState } from "./treatment";

export type AssistantReply = {
  text: string;
  links?: ChatLink[];
  urgent?: boolean;
  /** Questions offered next. */
  followUps?: string[];
};

export type AssistantContext = {
  name: string;
  drug: string;
  today: string;
  dose: DoseState;
  site: string;
  eaten: { protein: number; fiber: number; meals: number };
  water: number;
  targets: Targets;
  /** Symptoms logged in the last three days, most frequent first. */
  recent: SymptomId[];
  /** What the person said worries them (onboarding screen 9). */
  worries: string[];
  checkedInToday: boolean;
  weight: WeightSummary | null;
};

export function buildContext(o: OnboardingState, data: AppData, now: Date): AssistantContext {
  const today = isoOf(now);
  const day = dayNutrients(data.meals, today);
  const since = addDays(today, -2);
  const counts = new Map<SymptomId, number>();
  for (const c of data.checkIns.filter((c) => c.date >= since)) {
    for (const id of Object.keys(c.symptoms) as SymptomId[]) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const siteValue = suggestSite(data.injections);
  return {
    name: o.name?.trim() ?? "",
    drug: medicationName(o.medication),
    today,
    dose: doseState(o, data.injections, now),
    site: SITES.find((s) => s.value === siteValue)?.label ?? "",
    eaten: { protein: day.protein, fiber: day.fiber, meals: mealsOn(data.meals, today).length },
    water: waterOn(data.water, today),
    targets: targetsFor(o, data.weights),
    recent: [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id),
    worries: o.worries ?? [],
    checkedInToday: data.checkIns.some((c) => c.date === today),
    weight: weightSummary(o, data.weights),
  };
}

// Pieces of answers that read the person's data

const fa = (n: number) => toFaDigits(n);

function nextDoseLine(ctx: AssistantContext): string {
  const s = ctx.dose;
  if (s.kind === "no-drug") return "هنوز دارویی برات ثبت نشده. هر وقت پزشکت مشخص کرد، از صفحه‌ی درمان اضافه‌اش کن تا یادآوری‌ها شروع بشن.";
  if (s.kind === "no-schedule") return "هنوز زمان تزریقت ثبت نشده؛ از صفحه‌ی درمان اضافه‌اش کن.";
  if (s.loggedToday) return `تزریق امروزت ثبت شده. بعدی: ${relativeDay(s.due, ctx.today)}، ساعت ${formatTime(s.time)}.`;
  if (s.kind === "today") return `امروز وقت تزریقته، ساعت ${formatTime(s.time)}. جای پیشنهادی این بار: ${ctx.site}.`;
  if (s.kind === "late")
    return `طبق ثبت‌هات، تزریقی که ${relativeDay(s.due, ctx.today)} وقتش بود ثبت نشده. اگه زدی، ثبتش کن؛ اگه جا افتاده، برای ادامه با پزشکت هماهنگ کن.`;
  return `تزریق بعدی‌ت: ${relativeDay(s.due, ctx.today)}، ساعت ${formatTime(s.time)} (${fa(s.daysLeft)} روز دیگه). جای پیشنهادی: ${ctx.site}.`;
}

function proteinLine(ctx: AssistantContext): string {
  if (!ctx.eaten.meals) return `هدف پروتئین امروزت ${fa(ctx.targets.protein)} گرمه و هنوز غذایی ثبت نکردی. از غذات عکس بگیر تا حسابش کنم.`;
  const left = Math.max(0, ctx.targets.protein - ctx.eaten.protein);
  return left
    ? `امروز تا الان حدود ${formatGrams(ctx.eaten.protein)} گرم پروتئین ثبت کردی، از هدف ${fa(ctx.targets.protein)} گرم؛ حدود ${formatGrams(left)} گرم دیگه مونده.`
    : `امروز حدود ${formatGrams(ctx.eaten.protein)} گرم پروتئین ثبت کردی و به هدفت (${fa(ctx.targets.protein)} گرم) رسیدی. آفرین!`;
}

function waterLine(ctx: AssistantContext): string {
  return `امروز ${fa(ctx.water)} لیوان آب ثبت کردی، از هدف ${fa(ctx.targets.water)} لیوان.`;
}

function fiberLine(ctx: AssistantContext): string {
  if (!ctx.eaten.meals) return `هدف فیبر روزانه‌ات ${fa(ctx.targets.fiber)} گرمه.`;
  return `امروز حدود ${formatGrams(ctx.eaten.fiber)} گرم فیبر ثبت کردی، از هدف ${fa(ctx.targets.fiber)} گرم.`;
}

function hasRecent(ctx: AssistantContext, ...ids: SymptomId[]): boolean {
  return ids.some((id) => ctx.recent.includes(id));
}

const guideLink = (id: string, label: string): ChatLink => ({ label, href: `/food/guide/${id}` });
const lessonLink = (id: string, label: string): ChatLink => ({ label, href: `/learn/${id}` });
const recipeLinks = (tag: RecipeTag, n = 2): ChatLink[] =>
  recipesTagged(tag)
    .slice(0, n)
    .map((r) => ({ label: r.title, href: `/food/recipes/${r.id}` }));

// Topics

type Topic = {
  id: string;
  /** Words that point to this topic; compared with spaces and ZWNJ removed. */
  keys: string[];
  /** Added to the score when the topic matches, so urgent topics win any tie. */
  weight?: number;
  answer: (ctx: AssistantContext) => AssistantReply;
};

const TOPICS: Topic[] = [
  {
    id: "crisis",
    weight: 20,
    keys: ["خودکشی", "خودمو بکشم", "خودم رو بکشم", "نمیخوام زنده", "نمی خوام زنده", "به زندگیم پایان", "آسیب به خودم", "خودزنی"],
    answer: (ctx) => ({
      urgent: true,
      text: [
        `${ctx.name ? `${ctx.name}، ` : ""}ممنونم که اینو بهم گفتی. حالت مهمه و لازم نیست تنهایی باهاش کنار بیای.`,
        "• اگه همین الان در خطری، با اورژانس ۱۱۵ تماس بگیر.\n• برای صحبت با یه مشاور: صدای مشاور ۱۴۸۰ (هر روز ۸ صبح تا ۱۲ شب) یا اورژانس اجتماعی ۱۲۳ (شبانه‌روزی).",
        "اگه می‌تونی، به یه نفر که بهش اعتماد داری هم خبر بده تا کنارت باشه.",
      ].join("\n\n"),
      links: [
        { label: "تماس با ۱۴۸۰", href: "tel:1480" },
        { label: "تماس با ۱۲۳", href: "tel:123" },
      ],
    }),
  },
  {
    id: "urgent",
    weight: 10,
    keys: [
      "درد شدید",
      "خیلی درد",
      "دردش زیاد",
      "تنگی نفس",
      "نفسم بالا",
      "نمیتونم نفس",
      "تورم صورت",
      "ورم صورت",
      "ورم لب",
      "تورم لب",
      "تورم گلو",
      "ورم گلو",
      "کهیر",
      "غش",
      "بیهوش",
      "خون بالا",
      "استفراغ خون",
      "مدفوع سیاه",
      "زرد شده",
      "زردی",
      "قفسه سینه",
      "پانکراس",
      "لوزالمعده",
      "تشنج",
    ],
    answer: (ctx) => ({
      urgent: true,
      text: [
        "چیزی که گفتی ممکنه نیاز به رسیدگی فوری داشته باشه.",
        "• اگه درد شدید شکم یا قفسه‌ی سینه، تنگی نفس، تورم صورت و گلو، یا بی‌حالی شدید داری، همین الان با اورژانس ۱۱۵ تماس بگیر یا به نزدیک‌ترین اورژانس برو.\n• برای بقیه‌ی علائم شدید، همین امروز با پزشکت تماس بگیر.",
        ctx.drug
          ? `به کادر درمان بگو که ${ctx.drug} مصرف می‌کنی.`
          : "به کادر درمان بگو که داروی کاهش وزن تزریقی مصرف می‌کنی.",
      ].join("\n\n"),
      links: [
        { label: "تماس با اورژانس ۱۱۵", href: "tel:115" },
        lessonLink("red-flags", "علائم هشدار"),
      ],
    }),
  },
  {
    id: "dose-change",
    weight: 3,
    keys: [
      "دوزم رو",
      "دوز رو",
      "دوزمو",
      "دوزم کمه",
      "دوزم زیاده",
      "تغییر دوز",
      "دو برابر",
      "دوتا بزنم",
      "بیشتر بزنم",
      "دوز بالاتر",
      "دوز بیشتر",
      "دوز کمتر",
    ],
    answer: () => ({
      text: [
        "تغییر دوز (بالا بردن، کم کردن یا قطعش) تصمیمیه که فقط پزشکت می‌گیره، چون به عوارض، قند خون و روند درمانت بستگی داره. من دوز پیشنهاد نمی‌دم.",
        "کاری که از دستم برمیاد:\n• دوزی که پزشکت تعیین کرده رو توی صفحه‌ی درمان ثبت کنی تا تاریخچه‌ات دقیق بمونه.\n• گزارش برای پزشک رو آماده کنی تا علائم، وزن و تزریق‌هات رو یه‌جا ببینه.",
        "اگه عوارض اذیتت می‌کنه، همینو به پزشکت بگو؛ ممکنه برای کم شدنشون راهی پیشنهاد بده، مثلاً دیرتر بالا بردن دوز.",
      ].join("\n\n"),
      links: [
        { label: "صفحه‌ی درمان", href: "/treatment" },
        { label: "گزارش برای پزشک", href: "/report" },
      ],
      followUps: ["برای تهوع چی کار کنم؟", "تزریق بعدیم کیه؟"],
    }),
  },
  {
    id: "missed",
    weight: 3,
    keys: ["یادم رفت", "جا افتاد", "جاافتاد", "فراموش کردم", "فراموشم شد", "دیر زدم", "نزدم", "عقب افتاد", "تزریقمو نزدم"],
    answer: (ctx) => ({
      text: [
        ctx.dose.kind === "late" ? nextDoseLine(ctx) : "",
        "اگه تزریق کردی ولی ثبتش نکردی، از دکمه‌ی «+» ثبتش کن تا برنامه‌ات درست بمونه.",
        "اگه واقعاً جا افتاده، اینکه الان بزنی یا منتظر نوبت بعد بمونی به داروت و تعداد روزهایی که گذشته بستگی داره. دفترچه‌ی داروت راهنمایی داره، ولی بهتره همین امروز با پزشک یا داروسازت هماهنگ کنی؛ مخصوصاً اگه چند نوبت پشت سر هم جا افتاده.",
        "دو دوز رو با هم یا پشت سر هم نزن.",
      ]
        .filter(Boolean)
        .join("\n\n"),
      links: [{ label: "صفحه‌ی درمان", href: "/treatment" }],
      followUps: ["تزریق بعدیم کیه؟", "قلم رو چطور نگه دارم؟"],
    }),
  },
  {
    id: "next-dose",
    keys: ["تزریق بعدی", "دوز بعدی", "کی تزریق", "کی بزنم", "نوبت بعدی", "چند روز مونده", "تزریقم کیه", "تزریق کیه", "کی باید بزنم"],
    answer: (ctx) => ({
      text: nextDoseLine(ctx),
      links: [{ label: "صفحه‌ی درمان", href: "/treatment" }],
      followUps: ["کجا تزریق کنم؟", "قلم رو چطور نگه دارم؟"],
    }),
  },
  {
    id: "nausea",
    keys: ["تهوع", "حالم بده", "حالم بد", "دلم آشوب", "دل آشوبه", "حالت تهوع", "بالا بیارم"],
    answer: (ctx) => ({
      text: [
        hasRecent(ctx, "nausea")
          ? "توی ثبت‌های این چند روزت هم حالت تهوع بوده. رایج‌ترین عارضه‌ی این داروهاست و معمولاً یکی دو روز بعد از تزریق و بعد از بالا رفتن دوز بیشتره."
          : "تهوع رایج‌ترین عارضه‌ی این داروهاست، مخصوصاً یکی دو روز بعد از تزریق و بعد از بالا رفتن دوز.",
        "چیزهایی که معمولاً کمک می‌کنه:\n• وعده‌های کوچیک، هر ۳ تا ۴ ساعت\n• غذای ساده و کم‌چرب مثل کته، سیب‌زمینی آب‌پز، نون تست و موز\n• چای زنجبیل یا دمنوش نعناع، جرعه‌جرعه\n• تا نیم ساعت بعد از غذا دراز نکش",
        "اگه مایعات توی معده‌ت نمی‌مونه یا درد شدید شکم داری، همون روز با پزشکت تماس بگیر.",
      ].join("\n\n"),
      links: [guideLink("nausea", "راهنمای غذا برای تهوع"), { label: "دستورهای سبک", href: "/food/recipes?tag=gentle" }],
      followUps: ["استفراغ کردم، چی کار کنم؟", "اشتها ندارم، چی بخورم؟"],
    }),
  },
  {
    id: "vomiting",
    keys: ["استفراغ", "بالا آوردم", "بالا اوردم", "بالا میارم", "قی کردم"],
    answer: () => ({
      text: [
        "اولویت اول اینه که آب بدنت کم نشه.",
        "• بعد از استفراغ کمی صبر کن، بعد هر چند دقیقه چند قلپ آب یا او‌آر‌اس بنوش.\n• وقتی مایعات موند، با غذای خیلی ساده شروع کن: نون تست، برنج ساده، سوپ رقیق.\n• غذای چرب و پرحجم رو فعلاً کنار بذار.",
        "اگه چند ساعته هیچ مایعی توی معده‌ت نمی‌مونه، سرگیجه داری، ادرارت خیلی کم شده یا درد شدید شکم داری، همون روز با پزشکت تماس بگیر.",
      ].join("\n\n"),
      links: [guideLink("vomiting", "راهنمای استفراغ"), lessonLink("red-flags", "علائم هشدار")],
      followUps: ["برای تهوع چی بخورم؟", "کدوم علائم خطرناکه؟"],
    }),
  },
  {
    id: "constipation",
    keys: ["یبوست", "دستشویی نمیرم", "دستشویی نرفتم", "اجابت مزاج", "کار نمیکنه روده", "شکمم کار نمی"],
    answer: (ctx) => ({
      text: [
        "یبوست با این داروها خیلی رایجه؛ روده کندتر کار می‌کنه و معمولاً کمتر می‌خوری و می‌نوشی.",
        `${waterLine(ctx)} ${fiberLine(ctx)}`,
        "سه کلید اصلی:\n• آب: کم‌کم و در طول روز\n• فیبر: کیوی، آلو، سبزیجات پخته، نون سنگک و جو؛ ولی کم‌کم زیادش کن\n• حرکت: یه پیاده‌روی کوتاه هر روز",
        "اگه چند روز گذشت و بهتر نشدی، درباره‌ی ملین با پزشک یا داروسازت صحبت کن. درد یا نفخ شدید، استفراغ یا دفع نشدن گاز یعنی فوری تماس بگیر.",
      ].join("\n\n"),
      links: [guideLink("constipation", "راهنمای غذا برای یبوست"), { label: "دستورهای پرفیبر", href: "/food/recipes?tag=fiber" }],
      followUps: ["روزی چقدر آب بخورم؟", "نفخ دارم، چی کار کنم؟"],
    }),
  },
  {
    id: "diarrhea",
    keys: ["اسهال", "شکم روش", "شکمروش"],
    answer: () => ({
      text: [
        "اسهال معمولاً گذراست، ولی آب و املاح زیادی از بدن می‌بره؛ پس اول مایعات.",
        "• بعد از هر بار اسهال یه لیوان آب یا او‌آر‌اس بنوش.\n• غذای ساده: برنج، موز، سیب‌زمینی آب‌پز، نون تست، سوپ رقیق.\n• فعلاً شیر، غذای چرب و تند، قهوه و نوشابه رو کنار بذار.",
        "اگه نشونه‌ی کم‌آبی داری (سرگیجه، ضعف، ادرار خیلی کم)، خون توی مدفوع دیدی، تب داری یا اسهال چند روز ادامه داشته، با پزشکت تماس بگیر.",
      ].join("\n\n"),
      links: [guideLink("diarrhea", "راهنمای غذا برای اسهال")],
      followUps: ["کدوم علائم خطرناکه؟", "روزی چقدر آب بخورم؟"],
    }),
  },
  {
    id: "heartburn",
    keys: ["سوزش", "ترش کردم", "ترش میکنم", "رفلاکس", "ریفلاکس", "سوزش معده"],
    answer: () => ({
      text: [
        "وقتی معده دیرتر خالی می‌شه، سوزش و ترش کردن بیشتر پیش میاد.",
        "• وعده‌ها رو کوچیک‌تر و آروم‌تر بخور.\n• تا دو سه ساعت بعد از غذا دراز نکش و شام رو زودتر بخور.\n• غذای تند، چرب و سرخ‌کرده، رب و مرکبات زیاد، قهوه و نوشابه رو کم کن.",
        "اگه هر روز تکرار می‌شه، موقع قورت دادن درد داری، یا درد قفسه‌ی سینه داری، با پزشکت صحبت کن؛ درد قفسه‌ی سینه رو با سوزش معده اشتباه نگیر.",
      ].join("\n\n"),
      links: [guideLink("heartburn", "راهنمای غذا برای سوزش معده")],
      followUps: ["نفخ دارم، چی کار کنم؟", "چطور وعده‌هام رو کوچیک کنم؟"],
    }),
  },
  {
    id: "bloating",
    keys: ["نفخ", "آروغ", "باد شکم", "گاز معده", "شکمم باد"],
    answer: () => ({
      text: [
        "نفخ و آروغ (گاهی با بوی تخم‌مرغ) با کند شدن هضم پیش میاد و معمولاً با چند تغییر کوچیک کمتر می‌شه.",
        "• آروم بخور و کمتر هوا قورت بده.\n• نوشابه و نوشیدنی گازدار، آدامس و شیرین‌کننده‌های مصنوعی رو کم کن.\n• حبوبات و کلم رو کم، خیس‌خورده و پخته بخور.\n• دمنوش نعناع یا رازیانه و یه قدم زدن کوتاه بعد از غذا کمک می‌کنه.",
        "اگه نفخ با درد شدید همراهه یا شکمت سفت و متورم شده، با پزشکت تماس بگیر.",
      ].join("\n\n"),
      links: [guideLink("bloating", "راهنمای نفخ و آروغ")],
      followUps: ["برای یبوست چی بخورم؟", "سوزش معده دارم، چی بخورم؟"],
    }),
  },
  {
    id: "appetite",
    keys: ["اشتها", "گرسنه نیستم", "گرسنم نمیشه", "نمیتونم غذا بخورم", "میل به غذا", "غذا نمیخورم", "هیچی نمیخورم"],
    answer: (ctx) => ({
      text: [
        "کم شدن اشتها بخشی از کار داروئه، ولی بدنت هنوز به پروتئین، آب و ویتامین نیاز داره.",
        proteinLine(ctx),
        "• منتظر گرسنگی نمون؛ هر ۳ تا ۴ ساعت یه چیز کوچیک بخور.\n• اول پروتئین: تخم‌مرغ، ماست چکیده، پنیر، یه لیوان شیر.\n• روزهای خیلی کم‌اشتها، نوشیدنی‌های مغذی مثل شیک موز و ماست راحت‌تر پایین می‌رن.",
        "اگه تقریباً هیچی نمی‌تونی بخوری یا ضعف و سرگیجه داری، با پزشکت صحبت کن.",
      ].join("\n\n"),
      links: [guideLink("low-appetite", "راهنمای کم‌اشتهایی"), ...recipeLinks("small", 1)],
      followUps: ["روزی چقدر پروتئین بخورم؟", "خیلی خسته‌ام، چی کار کنم؟"],
    }),
  },
  {
    id: "energy",
    keys: ["خسته", "خستگی", "بی حال", "بیحال", "انرژی ندارم", "بی جون", "سرگیجه", "سردرد", "سرم گیج", "سرم درد"],
    answer: (ctx) => ({
      text: [
        "خستگی، سردرد و سرگیجه، مخصوصاً هفته‌های اول، معمولاً از کم خوردن و کم‌آبیه.",
        waterLine(ctx),
        "• وعده‌ها رو منظم بخور و صبحانه رو رد نکن.\n• توی هر وعده پروتئین بذار.\n• آب رو در طول روز بنوش.\n• آروم از جات بلند شو، مخصوصاً صبح‌ها.",
        "اگه غش کردی یا نزدیک بود غش کنی، یا داروی دیابت مصرف می‌کنی و لرزش، تعریق یا گیجی داری، همون روز با پزشکت تماس بگیر.",
      ].join("\n\n"),
      links: [guideLink("low-energy", "راهنمای خستگی و سرگیجه"), lessonLink("hydration", "آب کافی؛ چرا و چقدر؟")],
      followUps: ["روزی چقدر آب بخورم؟", "اشتها ندارم، چی بخورم؟"],
    }),
  },
  {
    id: "protein",
    keys: ["پروتئین", "عضله", "عضلاتم"],
    answer: (ctx) => ({
      text: [
        "وقتی وزن کم می‌کنی، پروتئین کافی (کنار کمی ورزش قدرتی) کمک می‌کنه عضله‌هات حفظ بشن.",
        proteinLine(ctx),
        "منابع آشنا:\n• یه تخم‌مرغ: حدود ۶ گرم\n• یه کاسه‌ی کوچیک ماست چکیده: حدود ۱۴ گرم\n• یه تکه مرغ یا ماهی: حدود ۳۰ گرم\n• یه کاسه‌ی کوچیک عدس: حدود ۱۳ گرم",
        "هدف پیشنهادی از روی وزن هدفت حساب شده؛ با پزشک یا متخصص تغذیه‌ات می‌تونی از پروفایل تغییرش بدی.",
      ].join("\n\n"),
      links: [{ label: "دستورهای پرپروتئین", href: "/food/recipes?tag=protein" }, lessonLink("protein", "درس پروتئین")],
      followUps: ["امروز چی بپزم؟", "چه ورزشی برام خوبه؟"],
    }),
  },
  {
    id: "fiber",
    keys: ["فیبر"],
    answer: (ctx) => ({
      text: [
        fiberLine(ctx),
        "منابع خوب فیبر:\n• سبزیجات پخته و سالاد\n• میوه‌ها، مخصوصاً کیوی، سیب، گلابی و آلو\n• عدس و لوبیا\n• نون سنگک و جو دوسر",
        "فیبر رو کم‌کم زیاد کن و کنارش آب بنوش؛ یه‌دفعه زیاد کردنش نفخ میاره.",
      ].join("\n\n"),
      links: [{ label: "دستورهای پرفیبر", href: "/food/recipes?tag=fiber" }],
      followUps: ["برای یبوست چی بخورم؟", "روزی چقدر آب بخورم؟"],
    }),
  },
  {
    id: "water",
    keys: ["آب بخورم", "آب بنوشم", "چقدر آب", "مایعات", "تشنه", "لیوان آب", "کم آبی", "آب کافی"],
    answer: (ctx) => ({
      text: [
        waterLine(ctx),
        "با این داروها تشنگی کمتر حس می‌شه و آبی که از غذا می‌گرفتی هم کم می‌شه، برای همین کم‌آبی رایجه.",
        "• یه بطری آب همیشه دم دستت باشه.\n• چای کم‌رنگ، دوغ کم‌نمک و سوپ هم حساب می‌شن.\n• رنگ ادرار راهنمای خوبیه: زرد کم‌رنگ یعنی خوبه.",
        "اگه پزشکت به‌خاطر بیماری کلیه یا قلب مقدار دیگه‌ای گفته، همون رو ملاک بذار.",
      ].join("\n\n"),
      links: [{ label: "ثبت آب", href: "/food" }],
      followUps: ["برای یبوست چی بخورم؟", "خیلی خسته‌ام، چی کار کنم؟"],
    }),
  },
  {
    id: "food-log",
    keys: ["کالری", "عکس غذا", "ثبت غذا", "غذامو ثبت", "غذام رو ثبت", "چطور غذا ثبت"],
    answer: () => ({
      text: [
        "از تب تغذیه یا دکمه‌ی «+»، «عکس غذا» رو بزن. غذات رو می‌شناسم، مقدارش رو تخمین می‌زنم و پروتئین، فیبر و انرژیش رو حساب می‌کنم؛ تو هم می‌تونی هر چیزی رو اصلاح کنی.",
        "کالری رو فقط برای اطلاع نشون می‌دم و هدف کالری نداریم؛ با این داروها مهم‌تر از کالری، رسیدن به پروتئین، فیبر و آب کافیه.",
      ].join("\n\n"),
      links: [{ label: "رفتن به تغذیه", href: "/food" }],
      followUps: ["روزی چقدر پروتئین بخورم؟", "امروز چی بپزم؟"],
    }),
  },
  {
    id: "recipes",
    keys: ["دستور", "چی بپزم", "غذا درست", "شام چی", "ناهار چی", "صبحانه چی", "چی بخورم", "غذا چی", "آشپزی"],
    answer: (ctx) => {
      const tag: RecipeTag = hasRecent(ctx, "nausea", "vomiting", "diarrhea")
        ? "gentle"
        : hasRecent(ctx, "constipation")
          ? "fiber"
          : "protein";
      const picks = recipesTagged(tag).slice(0, 3);
      const why =
        tag === "gentle"
          ? "چون این چند روز علائم گوارشی ثبت کردی، چند تا غذای سبک:"
          : tag === "fiber"
            ? "چون این چند روز یبوست ثبت کردی، چند تا غذای پرفیبر:"
            : "چند تا غذای پرپروتئین و ساده:";
      return {
        text: [why, picks.map((r) => `• ${r.title}: ${r.summary}`).join("\n")].join("\n\n"),
        links: picks.map((r) => ({ label: r.title, href: `/food/recipes/${r.id}` })),
        followUps: ["روزی چقدر پروتئین بخورم؟", "چطور وعده‌هام رو کوچیک کنم؟"],
      };
    },
  },
  {
    id: "small-meals",
    keys: ["وعده کوچیک", "وعده هام", "زود سیر", "پرخوری", "بشقاب"],
    answer: () => ({
      text: [
        "با این داروها معده زودتر پر می‌شه و دیرتر خالی می‌شه، پس وعده‌های کوچیک‌تر هم راحت‌ترن هم تهوع کمتری میارن.",
        "• از بشقاب کوچیک‌تر استفاده کن.\n• لقمه‌های کوچیک و آروم؛ بین لقمه‌ها قاشق رو زمین بذار.\n• همین که سیر شدی دست بکش؛ لازم نیست بشقاب تموم بشه.\n• نوشیدنی‌ها رو بیشتر بین وعده‌ها بخور.",
      ].join("\n\n"),
      links: [lessonLink("small-meals", "وعده‌های کوچیک، آروم خوردن")],
      followUps: ["برای تهوع چی بخورم؟", "روزی چقدر پروتئین بخورم؟"],
    }),
  },
  {
    id: "exercise",
    keys: ["ورزش", "باشگاه", "پیاده روی", "پیادهروی", "تمرین", "بدنسازی"],
    answer: () => ({
      text: [
        "کنار پروتئین، ورزش قدرتی راه اصلی حفظ عضله‌ست.",
        "• هفته‌ای دو سه بار، هر بار ۲۰ تا ۳۰ دقیقه\n• حرکت‌های ساده با وزن بدن: نشستن و بلند شدن از صندلی، شنای دیوار، پل باسن\n• پیاده‌روی روزانه هم کنارش عالیه\n• روزهای بعد از تزریق که خسته‌تری، سبک‌تر",
        "اگه بیماری قلبی، مشکل مفصل یا درد داری، قبل از شروع با پزشکت مشورت کن.",
      ].join("\n\n"),
      links: [lessonLink("strength", "ورزش قدرتی برای حفظ عضله")],
      followUps: ["روزی چقدر پروتئین بخورم؟", "چرا وزنم کم نمی‌شه؟"],
    }),
  },
  {
    id: "hair",
    keys: ["ریزش مو", "موهام", "موهای سرم", "مو میریزه", "کم پشت"],
    answer: () => ({
      text: [
        "ریزش مو در دوره‌ی کم شدن سریع وزن گاهی پیش میاد و معمولاً موقتیه؛ بیشتر به خود کاهش وزن و کم بودن پروتئین و مواد مغذی ربط داره تا مستقیم به دارو.",
        "• پروتئین کافی بخور (هدف روزانه‌ات رو توی تغذیه می‌بینی).\n• غذای متنوع با میوه، سبزی و حبوبات.\n• برای رژیم‌های خیلی سخت و حذف وعده‌ها نرو.",
        "اگه ریزش شدیده یا چند ماه ادامه داره، با پزشکت درباره‌ی بررسی آهن، ویتامین‌ها و تیروئید صحبت کن.",
      ].join("\n\n"),
      links: [lessonLink("protein", "درس پروتئین")],
      followUps: ["روزی چقدر پروتئین بخورم؟"],
    }),
  },
  {
    id: "injection",
    keys: ["جای تزریق", "کجا تزریق", "کجا بزنم", "چطور تزریق", "درد تزریق", "کبود", "سوزن", "قلمم", "تزریق کنم"],
    answer: (ctx) => ({
      text: [
        ctx.site ? `جای پیشنهادی بعدی‌ت ${ctx.site}ه؛ جایی که بیشتر از همه استراحت کرده.` : "",
        "• جاها: شکم (دست‌کم ۵ سانت دورتر از ناف)، جلوی ران یا پشت بازو\n• هر بار جای تزریق رو عوض کن تا زیر پوست سفت نشه\n• اگه قلمت سوزن جدا داره، هر بار سوزن نو\n• سوزن مصرف‌شده فقط توی ظرف دربسته",
        "مرجع اصلی، دفترچه‌ی قلم خودت و داروسازته. اگه جای تزریق خیلی قرمز، داغ یا متورم شد، به پزشکت خبر بده.",
      ]
        .filter(Boolean)
        .join("\n\n"),
      links: [lessonLink("injection-basics", "تزریق، قدم‌به‌قدم"), { label: "صفحه‌ی درمان", href: "/treatment" }],
      followUps: ["قلم رو چطور نگه دارم؟", "تزریق بعدیم کیه؟"],
    }),
  },
  {
    id: "storage",
    keys: ["یخچال", "نگهداری", "نگه دارم", "فریزر", "دمای", "سفر", "مسافرت"],
    answer: () => ({
      text: [
        "• قبل از اولین استفاده، معمولاً توی یخچال (۲ تا ۸ درجه)\n• هیچ‌وقت فریزر؛ اگه یخ زد استفاده نکن\n• دور از آفتاب و گرما، مثل داشبورد ماشین\n• توی سفر توی کیف دستی، با کیف خنک؛ ولی مستقیم روی یخ نه",
        "اینکه بعد از اولین استفاده تا چند روز بیرون یخچال می‌مونه برای هر برند فرق داره؛ توی دفترچه‌ی داروت نوشته شده یا از داروساز بپرس.",
      ].join("\n\n"),
      links: [lessonLink("storage", "نگهداری قلم و سفر")],
      followUps: ["چطور درست تزریق کنم؟", "تزریق بعدیم کیه؟"],
    }),
  },
  {
    id: "how-it-works",
    keys: ["چطور کار", "مکانیسم", "سماگلوتاید", "تیرزپاتاید", "لیراگلوتاید", "glp", "جی ال پی", "این دارو چیه"],
    answer: () => ({
      text: [
        "این داروها شبیه هورمون‌هایی کار می‌کنن که بدنت بعد از غذا می‌سازه:",
        "• به مغز خبر می‌دن که سیر شدی\n• خالی شدن معده رو کندتر می‌کنن، پس سیری بیشتر طول می‌کشه\n• به تنظیم قند خون بعد از غذا کمک می‌کنن",
        "برای همین کم شدن اشتها بخشی از کار داروئه، و تهوع و یبوست هم از همین کند شدن معده میان. دوز معمولاً کم‌کم و با نظر پزشک بالا می‌ره.",
      ].join("\n\n"),
      links: [lessonLink("how-it-works", "داروت چطور کار می‌کنه؟")],
      followUps: ["هفته‌های اول درمان چی در انتظارمه؟", "عوارض رایج چیه؟"],
    }),
  },
  {
    id: "first-weeks",
    keys: ["هفته های اول", "هفته اول", "اول درمان", "شروع درمان", "در انتظارمه", "انتظار داشته باشم", "تازه شروع"],
    answer: () => ({
      text: [
        "هفته‌های اول بدنت داره به دارو عادت می‌کنه. خیلی‌ها این‌ها رو تجربه می‌کنن:",
        "• اشتها کم می‌شه و زودتر سیر می‌شی\n• یکی دو روز بعد از تزریق، تهوع یا خستگی خفیف\n• تغییر کار روده، بیشتر یبوست\n• کم شدن وزن، که معمولاً تدریجیه",
        "عوارض معمولاً با گذشت هفته‌ها کمتر می‌شن ولی بعد از هر بالا رفتن دوز ممکنه چند روز برگردن. حالت رو هر روز ثبت کن تا الگوش رو ببینی.",
      ].join("\n\n"),
      links: [lessonLink("first-weeks", "هفته‌های اول")],
      followUps: ["برای تهوع چی بخورم؟", "روزی چقدر پروتئین بخورم؟"],
    }),
  },
  {
    id: "side-effects",
    keys: ["عوارض", "عارضه", "طبیعیه", "عادیه"],
    answer: () => ({
      text: [
        "رایج‌ترین عوارض این داروها گوارشی‌ان و معمولاً با گذشت هفته‌ها کمتر می‌شن:",
        GUIDES.slice(0, 6)
          .map((g) => `• ${g.title}`)
          .join("\n"),
        "حالت رو هر روز ثبت کن تا ببینی کی بیشترن؛ برای هر کدوم توی تغذیه یه راهنمای غذا هست. درد شدید شکم، کم‌آبی یا علائم حساسیت یعنی فوری تماس با پزشک.",
      ].join("\n\n"),
      links: [{ label: "ثبت حال امروز", href: "/check-in" }, lessonLink("red-flags", "علائم هشدار")],
      followUps: ["برای تهوع چی بخورم؟", "کدوم علائم خطرناکه؟"],
    }),
  },
  {
    id: "red-flags",
    keys: ["خطرناک", "علائم هشدار", "کی به دکتر", "کی به پزشک", "اورژانس"],
    answer: () => ({
      text: [
        "این نشونه‌ها رو جدی بگیر و همون روز با پزشکت تماس بگیر:",
        "• درد شدید و ادامه‌دار شکم، مخصوصاً اگه به پشت می‌زنه\n• استفراغ یا اسهالی که نمی‌ذاره مایعات بمونه، یا نشونه‌های کم‌آبی\n• زرد شدن پوست یا چشم، تب با درد بالای شکم\n• با داروی دیابت: لرزش، تعریق یا گیجی",
        "تورم صورت و گلو، تنگی نفس یا کهیر گسترده: فوراً اورژانس ۱۱۵.",
      ].join("\n\n"),
      links: [lessonLink("red-flags", "کی باید فوری تماس بگیرم؟"), { label: "تماس با ۱۱۵", href: "tel:115" }],
      followUps: ["برای تهوع چی بخورم؟"],
    }),
  },
  {
    id: "progress",
    keys: ["چقدر کم کردم", "چند کیلو کم", "کیلو کم کردم", "پیشرفتم", "وزنم چقدر", "تا هدفم"],
    answer: (ctx) => {
      const w = ctx.weight;
      if (!w) return { text: "هنوز وزنی ثبت نکردی. از دکمه‌ی «+» وزنت رو ثبت کن تا پیشرفتت رو ببینی.", links: [{ label: "پیشرفت", href: "/progress" }] };
      const lines = [
        w.lost > 0
          ? `از ${formatKg(w.start)} به ${formatKg(w.current)} کیلو رسیدی؛ یعنی ${formatKg(w.lost)} کیلو کمتر. آفرین!`
          : `وزن فعلیت ${formatKg(w.current)} کیلوئه.`,
        w.toGoal ? `${formatKg(w.toGoal)} کیلو تا هدفت مونده.` : w.goal !== null ? "به هدفت رسیدی!" : "",
        "یادت باشه روند چند هفته‌ای مهمه، نه عدد هر روز.",
      ];
      return {
        text: lines.filter(Boolean).join("\n\n"),
        links: [{ label: "پیشرفت", href: "/progress" }],
        followUps: ["چرا وزنم کم نمی‌شه؟", "چه ورزشی برام خوبه؟"],
      };
    },
  },
  {
    id: "duration",
    keys: ["تا کی باید", "چه مدت", "چقدر طول", "قطع کنم", "قطع دارو", "ادامه بدم", "بعد از قطع", "برگشت وزن", "برمیگرده", "بعد از درمان"],
    answer: () => ({
      text: [
        "این داروها برای خیلی‌ها درمانی طولانی‌مدت‌ان و مدتش رو پزشکت تعیین می‌کنه. پژوهش‌ها نشون دادن وقتی دارو قطع می‌شه اشتها برمی‌گرده و بخش زیادی از وزن ممکنه کم‌کم برگرده.",
        "برای همین مهمه از همین حالا عادت‌هایی بسازی که بمونن:\n• پروتئین توی هر وعده\n• ورزش قدرتی منظم\n• وزن کردن منظم تا تغییرها رو زود ببینی",
        "قطع یا ادامه‌ی دارو رو فقط با پزشکت تصمیم بگیر، نه یه‌دفعه و خودسرانه.",
      ].join("\n\n"),
      links: [lessonLink("maintenance", "بعد از درمان: نگه داشتن نتیجه")],
      followUps: ["چه ورزشی برام خوبه؟", "روزی چقدر پروتئین بخورم؟"],
    }),
  },
  {
    id: "plateau",
    keys: ["کم نمیشه", "کم نمی شه", "ثابت مونده", "ثابت شده", "متوقف شده", "وزنم ثابت", "تکون نمیخوره"],
    answer: (ctx) => ({
      text: [
        "تقریباً همه یه جایی به هفته‌هایی می‌رسن که ترازو تکون نمی‌خوره؛ این به معنی کار نکردن دارو نیست.",
        ctx.weight && ctx.weight.lost > 0
          ? `از شروع تا الان ${formatKg(ctx.weight.lost)} کیلو کم کردی؛ روند چهار هفته‌ای رو ببین، نه هر روز رو.`
          : "روند چهار هفته‌ای رو ببین، نه هر روز رو.",
        "• دور کمر رو هم اندازه بگیر\n• پروتئین، آب و حرکت روزانه‌ات رو مرور کن\n• خواب و استرس هم اثر دارن",
        "اگه چند هفته تغییری نبوده، با پزشکت صحبت کن؛ تصمیم درباره‌ی دارو و دوز با اونه.",
      ].join("\n\n"),
      links: [{ label: "پیشرفت", href: "/progress" }, lessonLink("plateau", "وقتی وزنت ثابت می‌مونه")],
      followUps: ["چه ورزشی برام خوبه؟", "روزی چقدر پروتئین بخورم؟"],
    }),
  },
  {
    id: "alcohol",
    keys: ["الکل", "مشروب", "شراب", "آبجو"],
    answer: () => ({
      text: "الکل می‌تونه تهوع و ناراحتی معده رو بیشتر کنه و، به‌خصوص اگه داروی دیابت مصرف می‌کنی، قند خون رو پایین بیاره. درباره‌اش با پزشکت صحبت کن.",
      followUps: ["کدوم علائم خطرناکه؟"],
    }),
  },
  {
    id: "pregnancy",
    keys: ["باردار", "بارداری", "حاملگی", "حامله", "شیردهی", "شیر میدم", "ضد بارداری", "قرص ضدبارداری"],
    answer: () => ({
      text: [
        "در بارداری و شیردهی معمولاً این داروها استفاده نمی‌شن. اگه باردار هستی، قصد بارداری داری یا شیر می‌دی، همین حالا با پزشکت صحبت کن.",
        "اگه قرص ضدبارداری می‌خوری هم به پزشکت بگو؛ بعضی از این داروها می‌تونن روی اثر قرص تأثیر بذارن.",
      ].join("\n\n"),
    }),
  },
  {
    id: "report",
    keys: ["گزارش", "ویزیت", "دکترم ببینه", "پزشکم ببینه", "نشون دکتر"],
    answer: () => ({
      text: "گزارش برای پزشک، داروت، دوزها، تزریق‌ها، وزن، علائم و یادداشت‌هات رو توی یه صفحه جمع می‌کنه. می‌تونی PDF بگیری یا متنش رو بفرستی.",
      links: [{ label: "گزارش برای پزشک", href: "/report" }],
    }),
  },
  {
    id: "today",
    keys: ["امروز چطور بود", "امروز چطور پیش", "امروزم", "خلاصه امروز", "امروز چی کار کنم"],
    answer: (ctx) => ({
      text: [
        nextDoseLine(ctx),
        proteinLine(ctx),
        waterLine(ctx),
        ctx.checkedInToday ? "حال امروزت هم ثبت شده." : "حال امروزت هنوز ثبت نشده؛ یه لمس کافیه.",
      ].join("\n\n"),
      links: ctx.checkedInToday ? [{ label: "تغذیه", href: "/food" }] : [{ label: "ثبت حال امروز", href: "/check-in" }],
      followUps: ["امروز چی بپزم؟", "روزی چقدر آب بخورم؟"],
    }),
  },
  {
    id: "app",
    keys: ["دوزیار", "این برنامه", "این اپ", "چیکار میکنی", "چی کار میکنی", "کمکم کنی", "چطوری کمک"],
    answer: () => ({
      text: [
        "من دستیار دوزیارم. می‌تونم درباره‌ی این‌ها کمکت کنم:",
        "• عوارض و اینکه چی بخوری تا بهتر بشی\n• پروتئین، فیبر، آب و دستور پخت\n• تزریق، جای تزریق و نگهداری قلم\n• پیشرفتت و آماده شدن برای ویزیت",
        "جواب‌هام عمومی‌ان و جای پزشکت رو نمی‌گیرن؛ درباره‌ی دارو و دوز، تصمیم با پزشکه.",
      ].join("\n\n"),
      followUps: ["برای تهوع چی بخورم؟", "روزی چقدر پروتئین بخورم؟", "تزریق بعدیم کیه؟"],
    }),
  },
  {
    id: "thanks",
    keys: ["مرسی", "ممنون", "سپاس", "دمت گرم", "تشکر"],
    answer: (ctx) => ({ text: `خواهش می‌کنم${ctx.name ? `، ${ctx.name}` : ""}! هر وقت سؤالی داشتی همین‌جام.` }),
  },
  {
    id: "hello",
    keys: ["سلام", "درود", "خوبی", "چطوری"],
    answer: (ctx) => ({
      text: `سلام${ctx.name ? ` ${ctx.name}` : ""}! درباره‌ی دارو، عوارض، تغذیه یا همین برنامه هر سؤالی داری بپرس.`,
      followUps: suggestions(ctx).slice(0, 3),
    }),
  },
];

const FALLBACK: AssistantReply = {
  text: [
    "این سؤال رو هنوز بلد نیستم دقیق جواب بدم.",
    "فعلاً درباره‌ی عوارض و تغذیه، پروتئین و آب، تزریق و نگهداری قلم، ورزش و پیشرفتت می‌تونم کمک کنم. برای سؤال‌های پزشکی دقیق، بهتره از پزشکت بپرسی.",
  ].join("\n\n"),
  followUps: ["عوارض رایج چیه؟", "روزی چقدر پروتئین بخورم؟", "قلم رو چطور نگه دارم؟"],
};

/** The topic that matches the most words of the question (urgent ones first on a tie). */
function matchTopic(question: string): Topic | null {
  const q = compact(question);
  let best: { topic: Topic; score: number } | null = null;
  for (const topic of TOPICS) {
    const hits = topic.keys.filter((k) => q.includes(compact(k))).length;
    if (!hits) continue;
    const score = hits + (topic.weight ?? 0);
    if (!best || score > best.score) best = { topic, score };
  }
  return best?.topic ?? null;
}

/** Which topic a question goes to (for tests and debugging). */
export function topicOf(question: string): string | null {
  return matchTopic(question)?.id ?? null;
}

export function answer(question: string, ctx: AssistantContext): AssistantReply {
  return matchTopic(question)?.answer(ctx) ?? FALLBACK;
}

/** Onboarding worries (their wording) and the question each one leads to. */
const WORRY_QUESTIONS: Record<string, string> = {
  "حالت تهوع": "برای حالت تهوع چی بخورم؟",
  یبوست: "برای یبوست چی بخورم؟",
  اسهال: "برای اسهال چی بخورم؟",
  خستگی: "خیلی خسته‌ام، چی کار کنم؟",
  "ریزش مو": "موهام داره می‌ریزه، چی کار کنم؟",
  "از دست دادن عضله": "روزی چقدر پروتئین بخورم؟",
  "برگشت وزن بعد از قطع دارو": "بعد از قطع دارو وزنم برمی‌گرده؟",
  "ترس از تزریق": "چطور درست تزریق کنم؟",
};

/**
 * Questions to start with, the most relevant to this person first: what they logged lately,
 * a late dose, what they said worries them, then everyday questions.
 */
export function suggestions(ctx: AssistantContext): string[] {
  const list: string[] = [];
  for (const g of GUIDES) if (g.symptoms.some((s) => ctx.recent.includes(s))) list.push(g.ask);
  if (ctx.dose.kind === "late") list.push("تزریقم جا افتاده، چی کار کنم؟");
  for (const w of ctx.worries) if (WORRY_QUESTIONS[w]) list.push(WORRY_QUESTIONS[w]);
  list.push("تزریق بعدیم کیه؟", "امروز چقدر پروتئین خوردم؟", "امروز چی بپزم؟", "چه ورزشی برام خوبه؟", "قلم رو چطور نگه دارم؟");
  return [...new Set(list)].slice(0, 4);
}

/** «تهوع و یبوست» for the empty state's line about recent symptoms. */
export function recentLabel(ctx: AssistantContext): string | null {
  if (!ctx.recent.length) return null;
  return ctx.recent
    .slice(0, 2)
    .map((id) => SYMPTOM_LABEL[id])
    .join(" و ");
}
