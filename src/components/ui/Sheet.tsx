"use client";

import { useEffect, useId, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from "motion/react";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";

/**
 * Bottom sheet for a small focused task. The page behind dims (a modal task).
 * It rises from the bottom edge and leaves the same way. Pulled by its top (grabber and
 * title), it follows the finger and closes on a long enough drag or a downward flick,
 * otherwise springs back. The content below can scroll (wheels, calendars, a long form)
 * without moving it.
 * Escape and tapping the dimmed page also close it. Sits above the on-screen keyboard.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const keyboard = useKeyboardInset();
  const titleId = useId();
  const drag = useDragControls();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  }

  const spring = { type: "spring" as const, bounce: 0, duration: 0.45 };

  if (!mounted) return null;

  // Rendered on <body>: inside the animated page a transformed ancestor would break `fixed`.
  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 mx-auto max-w-[480px]">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-ink-900/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-surface px-6 pt-2 shadow-[0_-12px_40px_rgb(30_27_51/0.12)]"
            style={{ paddingBottom: keyboard > 0 ? keyboard + 16 : "max(env(safe-area-inset-bottom), 20px)" }}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={spring}
            drag={reduce ? false : "y"}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.9 }}
            onDragEnd={onDragEnd}
          >
            {/* Handle area: grabber and title. Pulling here moves the sheet. */}
            <div className="-mx-6 -mt-2 touch-none px-6 pt-2" onPointerDown={(e) => drag.start(e)}>
              <div aria-hidden="true" className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-violet-200" />
              <h2 id={titleId} className="pb-5 text-center text-title-section text-text-primary">
                {title}
              </h2>
            </div>
            {/* Tall content scrolls inside the sheet; the handle stays put */}
            <div
              className="-mx-6 overflow-y-auto overscroll-contain px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ maxHeight: `calc(100dvh - ${keyboard + 132}px)` }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
