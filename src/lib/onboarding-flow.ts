/**
 * Onboarding after sign-in: 11 screens in 3 sections (spec v1).
 * The progress bar has one segment per section; the current segment fills by how far
 * the person is inside that section.
 */

export const SECTIONS = [
  { title: "درمانت", screens: 5 },
  { title: "خودت", screens: 4 },
  { title: "یادآوری", screens: 2 },
] as const;

export type Progress = { section: number; screen: number; of: number };

/** `screen` is the 1-based screen number from the spec (1 to 11). */
export function progressFor(screen: number): Progress {
  let first = 1;
  for (let section = 0; section < SECTIONS.length; section++) {
    const { screens } = SECTIONS[section];
    if (screen < first + screens) return { section, screen: screen - first + 1, of: screens };
    first += screens;
  }
  return { section: SECTIONS.length - 1, screen: SECTIONS.at(-1)!.screens, of: SECTIONS.at(-1)!.screens };
}
