import { useId } from "react";

/** A small trend line with a soft fill below, for a stat card. Needs two or more values. */
export function Sparkline({ values, width = 130, height = 36 }: { values: number[]; width?: number; height?: number }) {
  const id = useId();
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 3;
  const points = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (width - pad * 2),
    pad + (1 - (v - min) / span) * (height - pad * 2),
  ]);
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const [lx, ly] = points.at(-1)!;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ direction: "ltr" }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-violet-400)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--color-violet-400)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L${width - pad} ${height}L${pad} ${height}Z`} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={lx}
        cy={ly}
        r={3}
        fill="var(--color-brand)"
        stroke="white"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
