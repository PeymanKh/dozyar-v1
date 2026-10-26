/**
 * A row of cards that scrolls sideways and snaps card by card, running edge to edge past the
 * page padding so the next card peeks in (the cue that there is more).
 */
export function Shelf({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </div>
  );
}
