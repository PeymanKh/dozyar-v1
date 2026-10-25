import { onlyDigits, toFaDigits } from "./digits";

export const MOBILE_LENGTH = 11; // 09xxxxxxxxx

/**
 * Normalizes whatever the user typed or pasted into a local Iranian mobile number.
 * Accepts Persian/Arabic/Latin digits, spaces, and +98 / 0098 / 98 / 9 prefixes.
 */
export function normalizeMobile(input: string): string {
  let d = onlyDigits(input);
  if (d.startsWith("0098")) d = "0" + d.slice(4);
  else if (d.startsWith("98") && d.length > 10) d = "0" + d.slice(2);
  else if (d.startsWith("9")) d = "0" + d;
  return d.slice(0, MOBILE_LENGTH);
}

export function isValidMobile(mobile: string): boolean {
  return /^09\d{9}$/.test(mobile);
}

/** True when the start of the number already rules it out (so we can say so early). */
export function hasInvalidPrefix(mobile: string): boolean {
  return mobile.length >= 2 && !mobile.startsWith("09");
}

/** "09123456789" -> "۰۹۱۲ ۳۴۵ ۶۷۸۹" (also works on partial input). */
export function formatMobile(mobile: string): string {
  const parts = [mobile.slice(0, 4), mobile.slice(4, 7), mobile.slice(7, 11)].filter(Boolean);
  return toFaDigits(parts.join(" "));
}
