import { formatJalali } from "@/lib/jalali";
import { formatMg } from "@/lib/plan";
import { toFaDigits } from "@/lib/digits";
import type { doseSteps } from "@/lib/treatment";

type Steps = ReturnType<typeof doseSteps>;

/**
 * How the dose has stepped up over time: one bar per dose, as wide as the number of
 * injections taken at it and as tall as the dose. Time runs left to right, like the other
 * charts. Below, the same steps as a list, newest first.
 */
export function DoseStairs({ steps }: { steps: Steps }) {
  const max = Math.max(...steps.map((s) => s.mg ?? 0), 0.0001);

  return (
    <div className="flex flex-col gap-4">
      <div aria-hidden="true">
        <div dir="ltr" className="flex h-28 items-end gap-1.5">
          {steps.map((s, i) => (
            <div
              key={`${s.from}-${i}`}
              className="flex min-w-0 flex-col items-center justify-end gap-1.5"
              style={{ flexGrow: s.count, flexBasis: 0 }}
            >
              <span className="text-caption-small font-semibold text-text-secondary">
                {s.mg !== null ? formatMg(s.mg) : "؟"}
              </span>
              <div
                className={`w-full rounded-[8px] ${i === steps.length - 1 ? "bg-brand-gradient" : "bg-violet-200"}`}
                style={{ height: s.mg !== null ? 14 + (s.mg / max) * 58 : 8 }}
              />
            </div>
          ))}
        </div>
        <div dir="ltr" className="mt-2 flex justify-between text-caption-small text-text-tertiary">
          <span dir="rtl">{formatJalali(steps[0].from, false)}</span>
          <span dir="rtl">{formatJalali(steps.at(-1)!.to, false)}</span>
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-violet-100 border-t border-violet-100">
        {[...steps].reverse().map((s, i) => (
          <li key={`${s.from}-${i}`} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-body-strong text-text-primary">
                {s.mg !== null ? `${formatMg(s.mg)} میلی‌گرم` : "دوز نامشخص"}
              </p>
              <p className="text-caption text-text-secondary">
                از {formatJalali(s.from, false)}، {toFaDigits(s.count)} تزریق
              </p>
            </div>
            {i === 0 ? (
              <span className="rounded-full bg-surface-brand-subtle px-3 py-1 text-caption text-text-brand">الان</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
