/**
 * Persian text for matching (search, the assistant): Arabic ي/ك become ی/ک, diacritics and
 * tatweel go, the zero-width non-joiner becomes a space, digits become Latin, Latin is lowered.
 * «تخم‌مرغ»، «تخم مرغ» and «تخممرغ» then match each other through `compact`.
 */
export function normalizeFa(text: string): string {
  return text
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ۀة]/g, "ه")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[‌‏‎]/g, " ")
    .replace(/[؟?!.,،؛:«»"'()\-]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Without spaces, so compound words match however they were typed. */
export function compact(text: string): string {
  return normalizeFa(text).replace(/ /g, "");
}
