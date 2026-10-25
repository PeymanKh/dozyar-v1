"use client";

/**
 * One-time code input: one real <input> per character.
 * Adapted from the 21st.dev "otp-input" component for DozYar:
 * - accepts Persian and Arabic digits (Persian keyboards) and shows Persian digits
 * - always laid out left to right, like the code in the SMS, inside the RTL page
 * - violet design tokens, no shadows, light theme only
 * - no built-in message line: the screen owns status text (timer, spinner, errors)
 */

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toEnDigits, toFaDigits } from "@/lib/digits";

const EASE = [0.23, 1, 0.32, 1] as const;

export type OtpMode = "numeric" | "alphanumeric";

const ALLOW: Record<OtpMode, RegExp> = {
  numeric: /^[0-9]$/,
  alphanumeric: /^[0-9a-zA-Z]$/,
};

export type UseOtpInputOptions = {
  length?: number;
  mode?: OtpMode;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
};

export type OtpCellProps = {
  ref: (el: HTMLInputElement | null) => void;
  value: string;
  disabled: boolean;
  type: "text";
  inputMode: "numeric" | "text";
  autoComplete: string;
  autoCorrect: "off";
  autoCapitalize: "off";
  spellCheck: false;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: ClipboardEvent<HTMLInputElement>) => void;
  onFocus: (e: FocusEvent<HTMLInputElement>) => void;
  onBlur: (e: FocusEvent<HTMLInputElement>) => void;
};

export type UseOtpInputReturn = {
  chars: string[];
  value: string;
  length: number;
  complete: boolean;
  focusedIndex: number;
  getCellProps: (index: number) => OtpCellProps;
  focusAt: (index: number) => void;
  clear: () => void;
};

/**
 * Headless logic. `length` is fixed for the life of the component; give it a new `key`
 * to change the length.
 */
export function useOtpInput({
  length = 6,
  mode = "numeric",
  defaultValue = "",
  disabled = false,
  onChange,
  onComplete,
}: UseOtpInputOptions = {}): UseOtpInputReturn {
  const allow = ALLOW[mode];

  // Persian/Arabic digits become Latin before filtering, so ۱۲۳ works like 123.
  const keep = useCallback(
    (text: string) =>
      toEnDigits(text)
        .split("")
        .filter((c) => allow.test(c))
        .join(""),
    [allow],
  );

  const [chars, setChars] = useState<string[]>(() => {
    const seed = toEnDigits(defaultValue)
      .split("")
      .filter((c) => ALLOW[mode].test(c))
      .slice(0, length);
    return Array.from({ length }, (_, i) => seed[i] ?? "");
  });
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Latest values for event handlers, which can run before React re-renders.
  const charsRef = useRef(chars);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const changed = useRef(onChange);
  const completed = useRef(onComplete);
  useLayoutEffect(() => {
    changed.current = onChange;
    completed.current = onComplete;
  });

  const commit = useCallback((next: string[]) => {
    charsRef.current = next;
    setChars(next);
    const value = next.join("");
    changed.current?.(value);
    if (next.length > 0 && next.every((c) => c !== "")) completed.current?.(value);
  }, []);

  const focusAt = useCallback(
    (index: number) => {
      const el = refs.current[Math.max(0, Math.min(length - 1, index))];
      if (!el) return;
      el.focus();
      el.select();
    },
    [length],
  );

  const fillFrom = useCallback(
    (index: number, text: string) => {
      const incoming = keep(text);
      if (incoming.length === 0) return;
      const next = [...charsRef.current];
      let cursor = index;
      for (const c of incoming) {
        if (cursor >= length) break;
        next[cursor] = c;
        cursor += 1;
      }
      commit(next);
      focusAt(cursor);
    },
    [commit, focusAt, keep, length],
  );

  const clear = useCallback(() => {
    commit(Array.from({ length }, () => ""));
    focusAt(0);
  }, [commit, focusAt, length]);

  const getCellProps = useCallback(
    (index: number): OtpCellProps => ({
      ref: (el) => {
        refs.current[index] = el;
      },
      value: chars[index] ?? "",
      disabled,
      type: "text",
      inputMode: mode === "numeric" ? "numeric" : "text",
      // Only the first cell asks iOS/Android for the SMS code; a full code lands there and spreads.
      autoComplete: index === 0 ? "one-time-code" : "off",
      autoCorrect: "off",
      autoCapitalize: "off",
      spellCheck: false,
      onChange: (e) => {
        const previous = charsRef.current[index] ?? "";
        const raw = e.currentTarget.value;
        const trimmed = raw.length > 1 && previous && raw.startsWith(previous) ? raw.slice(previous.length) : raw;
        const incoming = keep(trimmed);

        if (incoming.length === 0) {
          if (raw.length === 0 && previous) {
            const next = [...charsRef.current];
            next[index] = "";
            commit(next);
          }
          e.currentTarget.value = charsRef.current[index] ?? "";
          return;
        }

        if (incoming.length === 1) {
          const next = [...charsRef.current];
          next[index] = incoming;
          e.currentTarget.value = incoming;
          commit(next);
          if (index < length - 1) focusAt(index + 1);
          return;
        }

        fillFrom(index, incoming);
      },
      onKeyDown: (e) => {
        if (e.key === "Backspace") {
          e.preventDefault();
          const current = charsRef.current;
          const next = [...current];
          if (current[index]) {
            next[index] = "";
            commit(next);
            return;
          }
          if (index > 0) {
            next[index - 1] = "";
            commit(next);
            focusAt(index - 1);
          }
          return;
        }
        if (e.key === "Delete") {
          e.preventDefault();
          const next = [...charsRef.current];
          next[index] = "";
          commit(next);
          return;
        }
        // Cells are laid out left to right, so the arrows map directly.
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          focusAt(index - 1);
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          focusAt(index + 1);
          return;
        }
        if (e.key === "Home") {
          e.preventDefault();
          focusAt(0);
          return;
        }
        if (e.key === "End") {
          e.preventDefault();
          focusAt(length - 1);
        }
      },
      onPaste: (e) => {
        e.preventDefault();
        const text = keep(e.clipboardData.getData("text"));
        fillFrom(text.length >= length ? 0 : index, text);
      },
      onFocus: (e) => {
        e.currentTarget.select();
        const firstEmpty = charsRef.current.findIndex((c) => c === "");
        if (firstEmpty !== -1 && firstEmpty < index) {
          focusAt(firstEmpty);
          return;
        }
        setFocusedIndex(index);
      },
      onBlur: (e) => {
        const to = e.relatedTarget as HTMLInputElement | null;
        if (to && refs.current.includes(to)) return;
        setFocusedIndex(-1);
      },
    }),
    [chars, commit, disabled, fillFrom, focusAt, keep, length, mode],
  );

  return {
    chars,
    value: chars.join(""),
    length,
    complete: chars.length > 0 && chars.every((c) => c !== ""),
    focusedIndex,
    getCellProps,
    focusAt,
    clear,
  };
}

export type OtpStatus = "idle" | "error" | "success";

export type OtpInputHandle = {
  clear: () => void;
  focus: () => void;
};

export type OtpInputProps = {
  length?: number;
  mode?: OtpMode;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  status?: OtpStatus;
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  focusOnError?: boolean;
  /** Id of the element that describes the field (status line), for screen readers. */
  describedBy?: string;
  className?: string;
  ref?: React.Ref<OtpInputHandle>;
};

export function OtpInput({
  length = 6,
  mode = "numeric",
  defaultValue = "",
  onChange,
  onComplete,
  status = "idle",
  label = "کد تأیید",
  disabled = false,
  autoFocus = false,
  focusOnError = true,
  describedBy,
  className = "",
  ref,
}: OtpInputProps) {
  const reduced = useReducedMotion();
  const { chars, focusedIndex, getCellProps, focusAt, clear } = useOtpInput({
    length,
    mode,
    defaultValue,
    disabled,
    onChange,
    onComplete,
  });

  const wasError = useRef(false);
  const error = status === "error";
  const success = status === "success";

  useImperativeHandle(ref, () => ({ clear, focus: () => focusAt(0) }), [clear, focusAt]);

  useEffect(() => {
    if (error && !wasError.current && focusOnError && !disabled) focusAt(0);
    wasError.current = error;
  }, [error, focusOnError, disabled, focusAt]);

  useEffect(() => {
    if (autoFocus && !disabled) focusAt(0);
  }, [autoFocus, disabled, focusAt]);

  const enter = reduced ? { duration: 0 } : { duration: 0.22, ease: EASE };

  return (
    <motion.div
      role="group"
      aria-label={label}
      dir="ltr"
      className={`flex gap-2.5 ${className}`}
      initial={false}
      variants={{ idle: { x: 0 }, wrong: { x: [0, -8, 6, -4, 2, 0] } }}
      animate={error && !reduced ? "wrong" : "idle"}
      transition={{ duration: 0.36, ease: EASE }}
    >
      {Array.from({ length }, (_, i) => {
        const char = chars[i] ?? "";
        const active = focusedIndex === i;

        return (
          <motion.div
            key={i}
            className="relative h-14 min-w-0 flex-1"
            initial={false}
            animate={success && !reduced ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.35, delay: success ? i * 0.05 : 0 }}
          >
            <input
              {...getCellProps(i)}
              aria-label={`${label}، رقم ${toFaDigits(i + 1)} از ${toFaDigits(length)}`}
              aria-invalid={error || undefined}
              aria-describedby={describedBy}
              className={`size-full rounded-[16px] border text-center text-[16px] text-transparent caret-transparent outline-none transition-[background-color,border-color] duration-150 selection:bg-transparent focus-visible:outline-none ${
                success
                  ? "border-transparent bg-brand-gradient"
                  : error
                    ? "border-violet-400 bg-surface"
                    : active
                      ? "border-border-focus bg-surface"
                      : char
                        ? "border-border-brand bg-surface"
                        : "border-violet-200 bg-surface"
              }`}
            />

            <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
              <AnimatePresence initial={false} mode="popLayout">
                {char ? (
                  <motion.span
                    key={char}
                    initial={reduced ? false : { opacity: 0, scale: 0.97, y: 10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -6, filter: "blur(3px)" }}
                    transition={enter}
                    className={`col-start-1 row-start-1 font-sans text-[20px] font-medium ${
                      success ? "text-text-on-brand" : "text-text-primary"
                    }`}
                  >
                    {toFaDigits(char)}
                  </motion.span>
                ) : null}
              </AnimatePresence>

              {active && !char && !disabled ? (
                <span className="caret-blink col-start-1 row-start-1 h-6 w-0.5 rounded-full bg-brand" />
              ) : null}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default OtpInput;
