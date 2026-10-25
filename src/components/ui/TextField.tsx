"use client";

/**
 * Single-line text field in the onboarding style: 56px, lavender border, no shadow,
 * violet border while focused. Matches the phone number field.
 */
export function TextField({ ref, className = "", ...rest }: React.ComponentProps<"input">) {
  return (
    <input
      ref={ref}
      className={`h-14 w-full rounded-[18px] border border-violet-200 bg-surface px-4 text-[16px] font-medium text-text-primary caret-brand outline-none transition-[border-color] duration-200 placeholder:font-normal placeholder:text-text-tertiary/80 focus:border-border-focus ${className}`}
      {...rest}
    />
  );
}
