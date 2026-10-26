"use client";

import { useId } from "react";
import { monotonePath } from "@/lib/chart";

/**
 * A chart before there is data for it: a soft sample line (or bars) under a frosted veil, with
 * the reason and the next step on top. It shows what will appear here, so an empty card still
 * explains itself, and the sample is clearly not data (blurred, no axes, no numbers).
 */
export function GhostChart({
  kind = "line",
  height = 176,
  children,
}: {
  kind?: "line" | "bars";
  height?: number;
  /** The message and the action, centered over the veil. */
  children: React.ReactNode;
}) {
  const gradient = useId();
  const w = 320;
  const h = height;
  // A gentle downward trend with small wobbles, like a typical weight curve.
  const sample = [0.18, 0.26, 0.24, 0.36, 0.4, 0.38, 0.5, 0.56, 0.54, 0.64, 0.7, 0.72].map(
    (t, i, all) => [12 + (i / (all.length - 1)) * (w - 24), 14 + t * (h - 40)] as [number, number],
  );
  const line = monotonePath(sample);
  const bars = [0.55, 0.8, 0.35, 0.7, 0.9, 0.5, 0.65];

  return (
    <div className="relative overflow-hidden rounded-[18px]" style={{ height }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full scale-105 opacity-70 blur-[3px]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-violet-400)" stopOpacity="0.3" />
            <stop offset="1" stopColor="var(--color-violet-400)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={w} y1={h * f} y2={h * f} stroke="var(--color-violet-100)" strokeDasharray="2 4" />
        ))}
        {kind === "line" ? (
          <>
            <path d={`${line}L${sample.at(-1)![0]} ${h}L${sample[0][0]} ${h}Z`} fill={`url(#${gradient})`} />
            <path d={line} fill="none" stroke="var(--color-violet-400)" strokeWidth={3} strokeLinecap="round" />
          </>
        ) : (
          bars.map((b, i) => {
            const bw = (w - 24) / bars.length - 14;
            const x = 12 + i * ((w - 24) / bars.length) + 7;
            return (
              <rect
                key={i}
                x={x}
                y={h - 18 - b * (h - 40)}
                width={bw}
                height={b * (h - 40)}
                rx={6}
                fill="var(--color-violet-300)"
              />
            );
          })
        )}
      </svg>
      {/* The veil, so the sample reads as a preview, not as numbers */}
      <div className="absolute inset-0 bg-linear-to-b from-surface/40 via-surface/55 to-surface/80" />
      <div className="relative flex h-full flex-col items-center justify-center gap-3 px-6 text-center">{children}</div>
    </div>
  );
}
