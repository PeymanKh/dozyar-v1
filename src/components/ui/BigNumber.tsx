import { formatKg } from "@/lib/plan";

/** The value a ruler is on, large, with its unit: «۸۴٫۲ کیلوگرم». */
export function BigNumber({
  value,
  unit = "کیلوگرم",
  small = false,
}: {
  value: number;
  unit?: string;
  small?: boolean;
}) {
  return (
    <p className="flex items-baseline justify-center gap-1.5 text-text-primary" aria-hidden="true">
      <span className={`font-display font-bold ${small ? "text-[26px]" : "text-[40px] leading-none"}`}>
        {formatKg(value, true)}
      </span>
      <span className="text-label text-text-secondary">{unit}</span>
    </p>
  );
}
