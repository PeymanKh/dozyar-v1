/**
 * Daily check-in vocabulary: symptoms (with a 0–3 severity), overall mood and appetite.
 * The list covers the common side effects of GLP-1 medicines; wording is everyday Persian.
 */

export type SymptomId =
  "nausea" | "vomiting" | "constipation" | "diarrhea" | "heartburn" | "fatigue" | "headache" | "dizziness";

export const SYMPTOMS: { id: SymptomId; label: string }[] = [
  { id: "nausea", label: "حالت تهوع" },
  { id: "vomiting", label: "استفراغ" },
  { id: "constipation", label: "یبوست" },
  { id: "diarrhea", label: "اسهال" },
  { id: "heartburn", label: "سوزش معده" },
  { id: "fatigue", label: "خستگی" },
  { id: "headache", label: "سردرد" },
  { id: "dizziness", label: "سرگیجه" },
];

export const SYMPTOM_LABEL = Object.fromEntries(SYMPTOMS.map((s) => [s.id, s.label])) as Record<SymptomId, string>;

/** 0 = none, 1 = mild, 2 = moderate, 3 = severe. */
export type Severity = 0 | 1 | 2 | 3;
export const SEVERITY_LABEL: Record<Severity, string> = { 0: "نه", 1: "کم", 2: "متوسط", 3: "زیاد" };

export type Mood = 1 | 2 | 3 | 4 | 5;
export const MOODS: { value: Mood; label: string }[] = [
  { value: 1, label: "خیلی بد" },
  { value: 2, label: "بد" },
  { value: 3, label: "معمولی" },
  { value: 4, label: "خوب" },
  { value: 5, label: "عالی" },
];
export const MOOD_LABEL = Object.fromEntries(MOODS.map((m) => [m.value, m.label])) as Record<Mood, string>;

export type Appetite = "low" | "normal" | "high";
export const APPETITE_LABEL: Record<Appetite, string> = { low: "کم", normal: "معمولی", high: "زیاد" };

/**
 * When a check-in reports one of these as severe, a short safety note appears.
 * Pending doctor review of the wording.
 */
export const RED_FLAG_SYMPTOMS: SymptomId[] = ["vomiting", "diarrhea", "dizziness"];
export const RED_FLAG_NOTE =
  "اگه استفراغ، اسهال یا سرگیجه‌ی شدید و ادامه‌دار داری، یا درد شدید شکم، همین امروز با پزشکت تماس بگیر.";
