import { SEVERITY_LABEL, type Severity } from "@/lib/symptoms";

/** Severity as three rising bars (like signal strength), filled up to the level. */
export function SeverityBars({ level, className = "" }: { level: Severity; className?: string }) {
  return (
    <span
      role="img"
      aria-label={SEVERITY_LABEL[level]}
      className={`inline-flex items-end gap-[2px] ${className}`}
      dir="ltr"
    >
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`w-[3px] rounded-full ${n <= level ? "bg-brand" : "bg-violet-200"}`}
          style={{ height: 4 + n * 3 }}
        />
      ))}
    </span>
  );
}
