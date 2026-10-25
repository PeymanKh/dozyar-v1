# دوزیار (DozYar)

A Persian-first, mobile-first PWA companion for people on prescription weight-loss medication.
Product brief: `app_description.md`.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. To try it on your phone, open your computer's local IP on port 3000 from the same Wi-Fi.

## Stack

- Next.js 16 (App Router, `src/` directory), React 19, TypeScript
- Tailwind CSS 4, design tokens in `src/app/globals.css`
- Fonts: Estedad (display) and Vazirmatn (text), self-hosted at build time via `next/font`
- RTL by default: `<html lang="fa" dir="rtl">`

## Design system

The Figma sheet "Design System — Violet" is the source of truth. Token names in `globals.css`
mirror the Figma variables, and text utilities (`text-display-large`, `text-body`, ...) mirror the
Figma text styles. Use role colors (`text-text-primary`, `bg-surface`, `bg-brand-gradient`) in
screens, not raw shades.

Design guidance for agents lives in `.claude/skills/apple-design/SKILL.md`.

## Onboarding

Sign-in, then 11 short screens in 3 sections (spec: `onboarding.pdf`). Answers are saved as people
go (localStorage for now), and signing in again continues at the first unanswered screen.

| Route | Screen |
| --- | --- |
| `/` | Welcome |
| `/onboarding/phone` | Mobile number (accepts Persian or Latin digits, +98, paste) |
| `/onboarding/otp` | 5-digit code, iOS "From Messages" autofill, auto-verify, resend timer |
| `/onboarding/name` | 1 · Name or nickname |
| `/onboarding/journey` | 2 · Where you are in the treatment (decides the extra questions) |
| `/onboarding/medication` | 3 · Medication: brand cards with maker flag, "not on the list" sheet, "not decided yet" |
| `/onboarding/dose` | 4 · Dose chips per drug, other dose, not sure |
| `/onboarding/schedule` | 5 · First or last dose (Jalali calendar), weekday, time, site, start month |
| `/onboarding/about` | 6 · Sex, birth year and height wheels |
| `/onboarding/weight` | 7 · Weight ruler, starting weight for people already injecting |
| `/onboarding/goal` | 8 · Goal weight, healthy-range note |
| `/onboarding/worries` | 9 · Worries (optional, several) |
| `/onboarding/reminders` | 10 · Reminders: discreet preview, toggles, permission, iPhone home-screen sheet |
| `/onboarding/preparing` | Short "preparing your plan" animation built from the answers, then Today |

Sign-in is mocked in `src/lib/auth.ts` until the backend exists: any 5-digit code works except
`00000`, which shows the "wrong code" state. Motion uses the `motion` library with critically
damped springs; reduced-motion settings are respected.

Glass step icons are generated with `scripts/kie.py` (prompts logged in `design/assets/prompts.jsonl`)
and sized with `scripts/prep_icon.py`.

## The app

After onboarding, four tabs in a floating glass tab bar, a round «+» beside it for quick logging
(injection, check-in, weight, waist), and two pushed screens. Signed-in visitors to `/` go
straight back to where they were.

| Route | Screen |
| --- | --- |
| `/today` | The next injection on the brand card (countdown ring, due, late, logged today, no drug yet), this week with injection and check-in marks, today's check-in, weight and treatment tiles, one tip, the doctor report |
| `/treatment` | Drug, dose and time (recorded, never suggested), body map with the suggested next spot, dose steps, every injection (tap to delete, with undo) |
| `/symptoms` | Log first: today on the brand card (five faces, or today's entry with «ویرایش») and this week by face with «+» on open days. Then analysis for 7, 30 or 90 days: a plain-language summary, mood over time (daily dots, rolling trend, average, injections), most common symptoms; and patterns: symptoms through the injection cycle, a five-week calendar |
| `/progress` | Journey to the goal, weight chart (range switch, drag to read a day, injections and dose changes on the axis), this week, waist, private photos with before/after, every weigh-in |
| `/check-in` | Mood, symptoms with severity, appetite, note; `?date=` for a past day, `?mood=` from a face tapped on Today |
| `/report` | One-page summary for the doctor; «ذخیره به‌صورت PDF» prints it on A4, or share it as text |
| `/profile` | About me, reminders, data export, sample data, erase, sign out |

Everything is stored on the phone for now (MOCK until the Django API exists):

- `src/lib/onboarding-store.ts`: the answers (drug, current dose, schedule, goal, reminders)
- `src/lib/app-store.ts`: injections, weights, check-ins and waist measurements, seeded once from
  the answers
- `src/lib/photo-store.ts`: progress photos in IndexedDB, scaled down, never uploaded

The next dose is one interval (7 days or 1 day) after the last logged injection, at the planned
time; the suggested spot is the one rested longest. Profile → «داده‌ی نمونه» fills ten weeks of
believable data around the person's own answers, to see every screen full.

Medical guardrails: the app records doses and never suggests or changes one; a late injection
points to the doctor; severe vomiting, diarrhoea or dizziness shows a short safety note; tips are
everyday advice; there is no BMI anywhere. Tips, safety wording and the drug list are pending
review by a doctor and a pharmacist.
