const FA = "۰۱۲۳۴۵۶۷۸۹";
const AR = "٠١٢٣٤٥٦٧٨٩";

/** Latin digits -> Persian digits, for display. */
export function toFaDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => FA[Number(d)]);
}

/** Persian or Arabic digits -> Latin digits, for storage and validation. */
export function toEnDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (d) => String(FA.indexOf(d))).replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
}

/** Keep only digits (any script), returned as Latin digits. */
export function onlyDigits(value: string): string {
  return toEnDigits(value).replace(/\D/g, "");
}
