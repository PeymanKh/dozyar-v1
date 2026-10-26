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

After onboarding, five tabs in a floating glass tab bar, a round «+» beside it for quick logging
(food photo, injection, check-in, weight, a glass of water, waist), and pushed screens. Every tab
header has the assistant (✨) and the profile one tap away. Signed-in visitors to `/` go straight
back to where they were.

| Route | Screen |
| --- | --- |
| `/today` | The next injection on the brand card (countdown ring, due, late, logged today, no drug yet), today's food (protein ring, fiber meter, water glasses to tap, today's meals, the camera), today's check-in, weight and treatment tiles, the assistant with two questions that fit today, the next lesson, the doctor report |
| `/food` | تغذیه. Today against the targets on the brand card with «عکس غذا» / «بدون عکس», today's meals (tap to change or delete) and water, protein this week against the target, «حالت خوب نیست؟ چی بخوری» (a guide per side effect; the one matching a recent check-in comes first), recipes that suit the person now, the food lessons |
| `/food/guide/[id]` | One side effect: why it happens, what usually helps, what to go easy on, habits, when to call the doctor, matching recipes, ask the assistant |
| `/food/recipes` | Every recipe with filters (`?tag=protein`, `gentle`, `fiber`, `small`, `breakfast`, `quick`) |
| `/food/recipes/[id]` | A recipe: nutrients per serving, why it suits the treatment, ingredients to tick off (scaled by a servings stepper), steps, «خوردمش؛ ثبتش کن» logs one serving |
| `/treatment` | Drug, dose and time (recorded, never suggested), body map with the suggested next spot, dose steps, every injection (tap to delete, with undo), lessons about the medicine |
| `/symptoms` | Log first: today on the brand card (five faces, or today's entry with «ویرایش»), help for today's symptoms (the food guide, the assistant), and this week by face with «+» on open days. Then analysis for 7, 30 or 90 days: a plain-language summary, mood over time (daily dots, rolling trend, average, injections), most common symptoms; and patterns: symptoms through the injection cycle, a five-week calendar |
| `/progress` | Journey to the goal, weight chart (range switch, drag to read a day, injections and dose changes on the axis; a blurred sample chart with what makes it appear until there are two weigh-ins), this week, waist, private photos with before/after, every weigh-in |
| `/chat` | The assistant as a conversation: starter questions from the person's own data and worries, answers written out word by word (stoppable), links into the app, follow-up questions, red-flag and crisis answers, a new conversation with undo; `?q=` asks a question sent from elsewhere |
| `/learn` | Lessons as a path (how far along, the next one) and by topic: starting treatment, side effects, food, lifestyle, after treatment |
| `/learn/[id]` | A lesson set for reading; reaching the takeaways marks it read; the next lesson and «از دستیار بپرس» |
| `/check-in` | Mood, symptoms with severity, appetite, note; `?date=` for a past day, `?mood=` from a face tapped on Today |
| `/report` | One-page summary for the doctor, now with food (protein, fiber and water on the days logged); «ذخیره به‌صورت PDF» prints it on A4, or share it as text |
| `/profile` | About me, daily food targets, reminders, the assistant and the lessons, data export, sample data, erase, sign out |

Logging a meal happens in one sheet (`src/components/app/sheets/MealSheet.tsx`), opened from any
«عکس غذا» button: the photo is recognised (a short scan over the picture), the foods found are
listed with an amount each, ready to correct (− / +, remove, add from the food list), with the
meal's protein, fiber, energy, carbs and fat, the time and which meal. The photo input lives
once in the app shell (`MealCamera`); buttons call `pickMealPhoto()` inside the tap.

Food targets are protein, fiber and water only, on purpose: no calorie goal. Calories are shown
as information. Protein starts at 1.2 g per kg of the goal weight (60 to 120 g), fiber at 25 g
(30 g for men), water at 8 glasses; the person changes them in Profile.

Everything is stored on the phone for now (MOCK until the Django API exists):

- `src/lib/onboarding-store.ts`: the answers (drug, current dose, schedule, goal, reminders, food targets)
- `src/lib/app-store.ts`: injections, weights, check-ins, waist measurements, meals and water,
  seeded once from the answers
- `src/lib/photo-store.ts`: progress photos in IndexedDB, scaled down, never uploaded
- `src/lib/meal-photos.ts`: meal photos in IndexedDB, small, never uploaded
- `src/lib/chat-store.ts` and `src/lib/learn-store.ts`: the conversation and the lessons read

Two parts are stand-ins for services that come with the backend:

- `src/lib/food-ai.ts` recognises a meal from its photo: it waits like a network call and picks a
  believable Iranian meal for the time of day (the same one for the same photo). Replace it with
  the vision model behind the Django API; the return shape stays the same. With a real model the
  photo leaves the phone, so the wording on the review screen changes with it.
- `src/lib/assistant.ts` answers questions: keywords pick a topic, and each topic has a written
  answer that reads the person's own data. Replace `answer()` with the language model behind the
  API; keep its rules (never a dose, red flags first, crisis lines, the doctor decides).

The next dose is one interval (7 days or 1 day) after the last logged injection, at the planned
time; the suggested spot is the one rested longest. Profile → «داده‌ی نمونه» fills ten weeks of
believable data around the person's own answers (and two weeks of meals and water), to see every
screen full.

Medical guardrails: the app records doses and never suggests or changes one; a late injection
points to the doctor; severe vomiting, diarrhoea or dizziness shows a short safety note; the
assistant sends dose questions to the doctor, answers red flags (severe pain, breathing, allergy
signs) with emergency 115 first, and answers thoughts of self-harm with the 1480 and 123 lines;
there is no BMI anywhere and no calorie goal. Pending review by a doctor, a pharmacist and a
dietitian: the drug list (`medications.ts`), the food guide per side effect (`food-guide.ts`), the
lessons (`learn.ts`), the assistant's answers (`assistant.ts`), the food values (`foods.ts`) and
the recipes (`recipes.ts`). Each file says so at the top.
