/**
 * Medication list for onboarding screen 3 (and dose chips for screen 4).
 * Sources: "دوزیار – Onboarding flow v1", plus Iranian brands from Persian health press
 * (Oct 2026). PENDING PHARMACIST REVIEW of every row and dose, especially the brands marked
 * "single source" and Velorita's pen strengths. Tirzepatide and liraglutide brands reuse the
 * originator's dose steps until each pen's strengths are confirmed.
 */

export type Rhythm = "weekly" | "daily";

/** Country of the maker, for the flag (ISO 3166 code, files in public/flags). */
export type Country = "ir" | "dk" | "us";

export type Medication = {
  id: string;
  fa: string;
  en: string;
  /** Generic name in Persian, shown under the brand. */
  generic: string;
  rhythm: Rhythm;
  country: Country;
  /** Dose chips in mg, lowest first. */
  doses: number[];
};

const SEMA_OZEMPIC = [0.25, 0.5, 1, 2];
const TIRZ = [2.5, 5, 7.5, 10, 12.5, 15];
const LIRA_OBESITY = [0.6, 1.2, 1.8, 2.4, 3];

/** Weekly first, then daily; Iranian brands first within each. */
export const MEDICATIONS: Medication[] = [
  {
    id: "velorita",
    fa: "ولوریتا",
    en: "Velorita",
    generic: "سماگلوتاید",
    rhythm: "weekly",
    country: "ir",
    doses: [0.25, 0.5, 1],
  },
  { id: "zcorpa", fa: "زیکورپا", en: "ZCorpa", generic: "تیرزپاتاید", rhythm: "weekly", country: "ir", doses: TIRZ },
  // single source
  {
    id: "tirzacto",
    fa: "تیرزکتو",
    en: "Tirzacto",
    generic: "تیرزپاتاید",
    rhythm: "weekly",
    country: "ir",
    doses: TIRZ,
  },
  // single source
  {
    id: "spartina",
    fa: "اسپارتینا",
    en: "Spartina",
    generic: "تیرزپاتاید",
    rhythm: "weekly",
    country: "ir",
    doses: TIRZ,
  },
  // single source
  { id: "lanisa", fa: "لانیسا", en: "Lanisa", generic: "تیرزپاتاید", rhythm: "weekly", country: "ir", doses: TIRZ },
  {
    id: "ozempic",
    fa: "اوزمپیک",
    en: "Ozempic",
    generic: "سماگلوتاید",
    rhythm: "weekly",
    country: "dk",
    doses: SEMA_OZEMPIC,
  },
  {
    id: "wegovy",
    fa: "ویگوی",
    en: "Wegovy",
    generic: "سماگلوتاید",
    rhythm: "weekly",
    country: "dk",
    doses: [0.25, 0.5, 1, 1.7, 2.4],
  },
  {
    id: "mounjaro",
    fa: "مانجارو",
    en: "Mounjaro",
    generic: "تیرزپاتاید",
    rhythm: "weekly",
    country: "us",
    doses: TIRZ,
  },
  {
    id: "melitide",
    fa: "ملیتاید",
    en: "Melitide",
    generic: "لیراگلوتاید",
    rhythm: "daily",
    country: "ir",
    doses: LIRA_OBESITY,
  },
  // single source
  {
    id: "maciza",
    fa: "ماسیزا",
    en: "Maciza",
    generic: "لیراگلوتاید",
    rhythm: "daily",
    country: "ir",
    doses: LIRA_OBESITY,
  },
  {
    id: "saxenda",
    fa: "ساکسندا",
    en: "Saxenda",
    generic: "لیراگلوتاید",
    rhythm: "daily",
    country: "dk",
    doses: LIRA_OBESITY,
  },
  {
    id: "victoza",
    fa: "ویکتوزا",
    en: "Victoza",
    generic: "لیراگلوتاید",
    rhythm: "daily",
    country: "dk",
    doses: [0.6, 1.2, 1.8],
  },
];

export const RHYTHM_LABEL: Record<Rhythm, string> = { weekly: "هفتگی", daily: "روزانه" };
export const RHYTHM_GROUP: Record<Rhythm, string> = { weekly: "تزریق هفتگی", daily: "تزریق روزانه" };

export const COUNTRY_NAME: Record<Country, string> = { ir: "ایران", dk: "دانمارک", us: "آمریکا" };

export function findMedication(id: string): Medication | undefined {
  return MEDICATIONS.find((m) => m.id === id);
}
