import type { Mood } from "@/lib/symptoms";

// Mouths from a deep frown (1) to a wide smile (5), same stroke as the line icons.
const MOUTH: Record<Mood, string> = {
  1: "M8 16.6Q12 12.6 16 16.6",
  2: "M8.6 16Q12 14 15.4 16",
  3: "M8.6 15.2H15.4",
  4: "M8.4 14.4Q12 17.4 15.6 14.4",
  5: "M7.6 13.6Q12 19.4 16.4 13.6Z",
};

/** A line face for a mood (1 = very bad ... 5 = great). */
export function MoodFace({ mood, size = 24, className = "" }: { mood: Mood; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      {mood === 1 ? (
        <>
          <path d="M7.6 8.6 10 9.6" />
          <path d="M16.4 8.6 14 9.6" />
        </>
      ) : null}
      <path d="M9 10.4h.01" strokeWidth={2.6} />
      <path d="M15 10.4h.01" strokeWidth={2.6} />
      <path d={MOUTH[mood]} fill={mood === 5 ? "currentColor" : "none"} />
    </svg>
  );
}
