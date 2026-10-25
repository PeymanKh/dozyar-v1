/**
 * One short, general tip a day on Today, picked from what the person worries about and the
 * symptoms they logged lately. Everyday advice only (the kind printed on patient leaflets);
 * nothing about doses or stopping a medicine. PENDING DOCTOR REVIEW of the wording.
 */

import type { SymptomId } from "./symptoms";

export type TipIcon = "droplet" | "bowl" | "medal" | "journal" | "tape";

export type Tip = {
  id: string;
  icon: TipIcon;
  title: string;
  text: string;
  /** Worries (onboarding wording) or symptom ids this tip is about. */
  about: (string | SymptomId)[];
};

export const TIPS: Tip[] = [
  {
    id: "small-meals",
    icon: "bowl",
    title: "وعده‌های کوچیک‌تر",
    text: "آروم‌تر بخور و وقتی سیر شدی دست بکش. غذای خیلی چرب یا سرخ‌کرده حالت تهوع رو بیشتر می‌کنه.",
    about: ["حالت تهوع", "nausea", "vomiting", "heartburn"],
  },
  {
    id: "water",
    icon: "droplet",
    title: "آب کافی بنوش",
    text: "در طول روز کم‌کم آب بنوش، مخصوصاً اگه یبوست یا اسهال داری. یه بطری آب دم دستت باشه.",
    about: ["یبوست", "اسهال", "constipation", "diarrhea", "dizziness", "headache"],
  },
  {
    id: "fiber",
    icon: "bowl",
    title: "فیبر یادت نره",
    text: "سبزی، میوه، حبوبات و نون سبوس‌دار به کار روده کمک می‌کنن.",
    about: ["یبوست", "constipation"],
  },
  {
    id: "protein",
    icon: "medal",
    title: "پروتئین توی هر وعده",
    text: "وقتی اشتها کمه، توی هر وعده یه منبع پروتئین مثل تخم‌مرغ، ماست، مرغ یا حبوبات بذار.",
    about: ["از دست دادن عضله", "ریزش مو"],
  },
  {
    id: "strength",
    icon: "medal",
    title: "حرکت‌های قدرتی سبک",
    text: "هفته‌ای چند بار ورزش قدرتی سبک، کنار کم شدن وزن به حفظ عضله‌هات کمک می‌کنه.",
    about: ["از دست دادن عضله"],
  },
  {
    id: "rest",
    icon: "journal",
    title: "به خودت استراحت بده",
    text: "خستگی اول درمان رایجه. خواب منظم و وعده‌های سبک ولی سر وقت کمک می‌کنه.",
    about: ["خستگی", "fatigue"],
  },
  {
    id: "needle",
    icon: "droplet",
    title: "سوزن قلم خیلی ریزه",
    text: "اولین بارها می‌تونی از داروساز یا پرستار بخوای کنارت باشه. هر بار جای تزریق رو عوض کن.",
    about: ["ترس از تزریق"],
  },
  {
    id: "habits",
    icon: "medal",
    title: "عادت‌هایی که می‌مونن",
    text: "وعده‌های منظم و پیاده‌روی روزانه، عادت‌هایی‌ان که بعد از درمان هم کنارت می‌مونن.",
    about: ["برگشت وزن بعد از قطع دارو"],
  },
  {
    id: "log",
    icon: "journal",
    title: "چند ثانیه در روز",
    text: "ثبت روزانه‌ی حال و علائم، قبل از ویزیت تصویر دقیق‌تری از درمانت به پزشک می‌ده.",
    about: [],
  },
  {
    id: "waist",
    icon: "tape",
    title: "فقط عدد ترازو نیست",
    text: "دور کمر هم نشونه‌ی خوبیه. هر دو هفته یه بار، هم‌سطح ناف اندازه بگیر.",
    about: [],
  },
];

/** Tips about what matters to this person first, then the rest; one per day, in turn. */
export function tipOfTheDay(dayNumber: number, interests: string[]): Tip {
  const relevant = TIPS.filter((t) => t.about.some((a) => interests.includes(a)));
  const pool = relevant.length
    ? [...relevant, ...TIPS.filter((t) => !relevant.includes(t))].slice(0, Math.max(relevant.length + 1, 3))
    : TIPS;
  return pool[dayNumber % pool.length];
}
