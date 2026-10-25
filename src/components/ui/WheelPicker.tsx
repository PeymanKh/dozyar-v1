"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

/**
 * iOS-style wheel: native scroll with momentum, snapping to one item in the middle band.
 * Items fade and shrink with distance from the middle, like a drum. A light tick (vibration,
 * where the phone allows it) marks each step. Arrow keys and taps work too.
 */
export function WheelPicker<T extends string | number>({
  items,
  value,
  onChange,
  label,
  itemHeight = 44,
  visible = 5,
  className = "",
}: {
  items: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  itemHeight?: number;
  visible?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();
  const [scrollTop, setScrollTop] = useState(0);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIndex = useRef(-1);
  const latest = useRef({ value, items, onChange });
  useLayoutEffect(() => {
    latest.current = { value, items, onChange };
  });

  const pad = (itemHeight * (visible - 1)) / 2;
  const index = Math.max(
    0,
    items.findIndex((i) => i.value === value),
  );

  // Place the wheel on the current value. Also runs when a hidden page is shown again
  // (display:none resets scroll positions).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const i = Math.max(
      0,
      latest.current.items.findIndex((it) => it.value === latest.current.value),
    );
    el.scrollTop = i * itemHeight;
    lastIndex.current = i;
    setScrollTop(i * itemHeight);
  }, [itemHeight]);

  useEffect(
    () => () => {
      if (settle.current) clearTimeout(settle.current);
    },
    [],
  );

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / itemHeight)));
    if (i !== lastIndex.current) {
      lastIndex.current = i;
      if ("vibrate" in navigator) navigator.vibrate?.(3);
    }
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const { items: list, value: current, onChange: change } = latest.current;
      const picked = list[i];
      if (picked && picked.value !== current) change(picked.value);
    }, 90);
  }

  function goTo(i: number) {
    const clamped = Math.min(items.length - 1, Math.max(0, i));
    ref.current?.scrollTo({ top: clamped * itemHeight, behavior: "smooth" });
  }

  return (
    <div className={`relative ${className}`} style={{ height: itemHeight * visible }}>
      {/* The middle band: what is selected */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 rounded-[14px] bg-surface-brand-subtle"
        style={{ top: pad, height: itemHeight }}
      />
      <div
        ref={ref}
        role="listbox"
        tabIndex={0}
        aria-label={label}
        aria-activedescendant={`${uid}-${index}`}
        onScroll={onScroll}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            goTo(index - 1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            goTo(index + 1);
          }
        }}
        className="relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-[14px] outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-border-focus [&::-webkit-scrollbar]:hidden"
        style={{ paddingBlock: pad }}
      >
        {items.map((item, i) => {
          const distance = Math.min(2.5, Math.abs(i * itemHeight - scrollTop) / itemHeight);
          return (
            <div
              key={String(item.value)}
              id={`${uid}-${i}`}
              role="option"
              aria-selected={i === index}
              onClick={() => goTo(i)}
              className="grid snap-center place-items-center text-[19px] font-medium text-text-primary select-none"
              style={{ height: itemHeight }}
            >
              {/* The drum effect lives on the text, never on the snap target: transforming the
                  snapped box makes the browser re-snap on every frame and the wheel drifts. */}
              <span style={{ opacity: 1 - distance * 0.32, transform: `scale(${1 - distance * 0.07})` }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
