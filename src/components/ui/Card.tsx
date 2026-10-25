import Link from "next/link";
import { ChevronBack } from "./icons";

/**
 * The app's content surface: white on the lavender canvas, a hairline lavender edge and a
 * faint violet shadow. One radius for every card so the screens read as one system.
 */
export function Card({ className = "", children, ...rest }: React.ComponentProps<"section">) {
  return (
    <section
      className={`rounded-[24px] border border-violet-100 bg-surface shadow-[0_1px_2px_rgb(30_27_51/0.03),0_10px_28px_-14px_rgb(110_75_245/0.16)] ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}

/** A section heading between cards, with an optional link at the end («همه»). */
export function SectionTitle({
  children,
  href,
  linkLabel = "همه",
  id,
}: {
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
  id?: string;
}) {
  return (
    <div className="flex items-center justify-between px-1 pb-2.5">
      <h2 id={id} className="text-title-section text-text-primary">
        {children}
      </h2>
      {href ? (
        <Link href={href} className="-me-2 flex h-11 items-center gap-0.5 px-2 text-label text-text-brand">
          {linkLabel}
          <ChevronBack size={16} />
        </Link>
      ) : null}
    </div>
  );
}

/** Rows inside a card, separated by hairlines that stop short of the edges (inset grouped list). */
export function RowList({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`divide-y divide-violet-100 ${className}`}>{children}</div>;
}
