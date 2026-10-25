"use client";

import { useReducedMotion } from "motion/react";
import type { InjectionSite } from "@/lib/onboarding-store";
import { SITES } from "@/lib/plan";

const LABEL = Object.fromEntries(SITES.map((s) => [s.value, s.label])) as Record<InjectionSite, string>;

/**
 * The six injection spots on a front-facing figure. Front view: the person's right side is
 * on the viewer's left, and the labels under the feet say so.
 * Each spot has a drawn zone and a larger invisible hit area.
 */
type Zone = {
  site: InjectionSite;
  shape: "rect" | "ellipse";
  x: number;
  y: number;
  w: number;
  h: number;
  hit: [number, number, number, number];
  arm?: "right" | "left";
};

const ZONES: Zone[] = [
  { site: "arm-right", shape: "rect", x: 48.5, y: 78, w: 11, h: 40, hit: [36, 70, 30, 56], arm: "right" },
  { site: "arm-left", shape: "rect", x: 140.5, y: 78, w: 11, h: 40, hit: [134, 70, 30, 56], arm: "left" },
  { site: "belly-right", shape: "ellipse", x: 86, y: 132, w: 24, h: 32, hit: [66, 110, 34, 46] },
  { site: "belly-left", shape: "ellipse", x: 114, y: 132, w: 24, h: 32, hit: [100, 110, 34, 46] },
  { site: "thigh-right", shape: "rect", x: 71, y: 190, w: 22, h: 50, hit: [60, 182, 40, 66] },
  { site: "thigh-left", shape: "rect", x: 107, y: 190, w: 22, h: 50, hit: [100, 182, 40, 66] },
];

// Arms hang slightly outward from the shoulders.
const ARM_TILT = { right: "rotate(6 54 64)", left: "rotate(-6 146 64)" };

export function BodyMap({
  value,
  onChange,
  suggested,
  last,
  use,
  height = 300,
}: {
  /** Pick mode: the chosen spot. */
  value?: InjectionSite | null;
  onChange?: (site: InjectionSite) => void;
  /** Rested longest; where the next one could go. */
  suggested?: InjectionSite;
  /** Where the last injection went. */
  last?: InjectionSite | null;
  /** Recent uses per spot, shades the zones (view mode). */
  use?: Map<InjectionSite, number>;
  height?: number;
}) {
  const reduce = useReducedMotion();
  const picking = !!onChange;
  const maxUse = Math.max(1, ...(use ? [...use.values()] : [1]));

  function fill(site: InjectionSite) {
    if (picking) return value === site ? "var(--color-brand)" : "var(--color-surface)";
    if (site === suggested) return "var(--color-brand)";
    const n = use?.get(site) ?? 0;
    if (n) return `color-mix(in srgb, var(--color-violet-300) ${Math.round(45 + (55 * n) / maxUse)}%, white)`;
    return "var(--color-surface)";
  }

  function shape(z: Zone, props: React.SVGProps<SVGRectElement & SVGEllipseElement>) {
    return z.shape === "ellipse" ? (
      <ellipse cx={z.x} cy={z.y} rx={z.w / 2} ry={z.h / 2} {...props} />
    ) : (
      <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={z.w / 2} {...props} />
    );
  }

  function zone(z: Zone) {
    const selected = picking && value === z.site;
    const strong = selected || (!picking && (z.site === suggested || (use?.get(z.site) ?? 0) > 0));
    const center = z.shape === "ellipse" ? { cx: z.x, cy: z.y } : { cx: z.x + z.w / 2, cy: z.y + z.h / 2 };
    const content = (
      <g
        key={z.site}
        role={picking ? "radio" : "img"}
        aria-checked={picking ? value === z.site : undefined}
        aria-label={`${LABEL[z.site]}${z.site === suggested ? "، پیشنهاد" : ""}${z.site === last ? "، آخرین تزریق" : ""}`}
        tabIndex={picking ? 0 : undefined}
        onClick={picking ? () => onChange(z.site) : undefined}
        onKeyDown={
          picking
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange(z.site);
                }
              }
            : undefined
        }
        className={picking ? "cursor-pointer outline-none [&:focus-visible>.focus-ring]:opacity-100" : undefined}
      >
        {/* Suggested spot breathes softly */}
        {z.site === suggested && !reduce
          ? shape(z, {
              fill: "var(--color-violet-400)",
              opacity: 0,
              style: { transformBox: "fill-box", transformOrigin: "center" },
              className: "animate-[zone-pulse_2.4s_ease-out_infinite]",
            })
          : null}
        {shape(z, {
          fill: fill(z.site),
          stroke: strong ? "transparent" : "var(--color-violet-300)",
          strokeWidth: 1.4,
          strokeDasharray: strong ? undefined : "3 3",
          style: { transition: "fill 200ms ease" },
        })}
        {/* Focus ring for keyboard users */}
        {picking
          ? shape(z, {
              fill: "none",
              stroke: "var(--color-border-focus)",
              strokeWidth: 2,
              className: "focus-ring opacity-0",
              transform: `translate(${center.cx} ${center.cy}) scale(1.25) translate(${-center.cx} ${-center.cy})`,
            })
          : null}
        {selected ? (
          <path
            d={`M${center.cx - 4.5} ${center.cy}l3 3 6-6`}
            fill="none"
            stroke="white"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : z.site === last ? (
          <circle cx={center.cx} cy={center.cy} r={3} fill="var(--color-violet-600)" />
        ) : null}
        <rect x={z.hit[0]} y={z.hit[1]} width={z.hit[2]} height={z.hit[3]} fill="transparent" />
      </g>
    );
    return z.arm ? (
      <g key={z.site} transform={ARM_TILT[z.arm]}>
        {content}
      </g>
    ) : (
      content
    );
  }

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="20 0 160 318"
        style={{ height, width: (height * 160) / 318 }}
        role={picking ? "radiogroup" : "img"}
        aria-label={picking ? "جای تزریق" : "جاهای تزریق روی بدن"}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="body-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-violet-100)" />
            <stop offset="1" stopColor="var(--color-violet-50)" />
          </linearGradient>
        </defs>
        {/* The figure: one soft silhouette (shapes share a fill, so they merge) */}
        <g fill="url(#body-fill)" aria-hidden="true">
          <circle cx="100" cy="25" r="17" />
          <rect x="93" y="38" width="14" height="16" rx="6" />
          <path d="M100 50C117 50 130 52 136 59C141 65 140 75 139 84L135 132C134 147 136 161 137 176H63C64 161 66 147 65 132L61 84C60 75 59 65 64 59C70 52 83 50 100 50Z" />
          <rect x="46.5" y="62" width="15" height="104" rx="7.5" transform={ARM_TILT.right} />
          <rect x="138.5" y="62" width="15" height="104" rx="7.5" transform={ARM_TILT.left} />
          <path d="M64 168H98.5L96.5 300C96.5 307 92.5 312 86.5 312H78.5C72.5 312 68.5 307 68.5 300Z" />
          <path d="M101.5 168H136L131.5 300C131.5 307 127.5 312 121.5 312H113.5C107.5 312 103.5 307 103.5 300Z" />
        </g>
        <circle cx="100" cy="132" r="1.8" fill="var(--color-violet-300)" aria-hidden="true" />
        {ZONES.map(zone)}
      </svg>
      <div
        aria-hidden="true"
        className="-mt-1 flex w-full justify-center gap-[52px] text-caption-small text-text-tertiary"
      >
        {/* Viewer's left is the person's right */}
        <span className="order-2">راست</span>
        <span className="order-1">چپ</span>
      </div>
    </div>
  );
}

export { LABEL as SITE_LABEL };
