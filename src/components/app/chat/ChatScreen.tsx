"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertCircle, ArrowUp, ChevronBack, PhoneCall, Sparkles, SquarePen, StopIcon } from "@/components/ui/icons";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
import { readAppData, useAppData } from "@/lib/app-store";
import { answer, buildContext, suggestions } from "@/lib/assistant";
import { addMessage, clearChat, restoreChat, useChat, type ChatLink, type ChatMessage } from "@/lib/chat-store";
import { readOnboarding, useOnboarding } from "@/lib/onboarding-store";
import { haptic, toast } from "@/lib/ui-store";
import { useNow } from "@/lib/use-now";
import bubbleIcon from "../../../../public/onboarding/code.png";

const spring = { type: "spring" as const, bounce: 0, duration: 0.4 };

/**
 * The assistant, as a conversation (the iMessage layout, mirrored for right-to-left: the
 * person's messages on the left in the brand color, the assistant's on the right). Answers
 * are written out word by word and can be stopped; each can point to a place in the app.
 * A question can arrive from elsewhere in the app as ?q= and is asked right away.
 * The header says it plainly: general answers, not medical advice.
 */
export function ChatScreen() {
  const now = useNow();
  if (!now) return null;
  return <Chat now={now} />;
}

function Chat({ now }: { now: Date }) {
  const router = useRouter();
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const keyboard = useKeyboardInset();
  const o = useOnboarding();
  const data = useAppData();
  const { messages } = useChat();
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState<{ id: string; words: number } | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const composer = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const [composerHeight, setComposerHeight] = useState(88);
  const busy = thinking || streaming !== null;

  const ctx = buildContext(o, data, now);
  const starters = suggestions(ctx);
  const name = o.name?.trim();

  // Keep the list clear of the composer, whatever its height.
  useLayoutEffect(() => {
    const el = composer.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setComposerHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Follow the conversation to its end.
  const last = messages.at(-1);
  useEffect(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [last?.id, thinking, streaming?.words, keyboard, reduce]);

  // Write the latest answer out, a couple of words at a time.
  useEffect(() => {
    if (!streaming) return;
    const message = messages.find((m) => m.id === streaming.id);
    const total = message ? message.text.split(/(\s+)/).length : 0;
    if (!message || streaming.words >= total) {
      const id = setTimeout(() => setStreaming(null), 0);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setStreaming({ id: streaming.id, words: streaming.words + 4 }), 32);
    return () => clearTimeout(id);
  }, [streaming, messages]);

  function ask(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    addMessage({ role: "user", text: question });
    setDraft("");
    if (input.current) input.current.style.height = "";
    setFollowUps([]);
    setThinking(true);
    haptic(6);
    setTimeout(
      () => {
        const reply = answer(question, buildContext(readOnboarding(), readAppData(), new Date()));
        const message = addMessage({ role: "assistant", text: reply.text, links: reply.links, urgent: reply.urgent });
        setThinking(false);
        setFollowUps(reply.followUps ?? []);
        if (!reduce) setStreaming({ id: message.id, words: 0 });
      },
      reduce ? 250 : 650 + Math.min(900, question.length * 12),
    );
  }

  // A question sent from elsewhere in the app (?q=), asked once, then dropped from the URL.
  const asked = useRef<string | null>(null);
  const preset = params.get("q");
  useEffect(() => {
    if (!preset) return;
    const id = setTimeout(() => {
      if (asked.current === preset) return;
      asked.current = preset;
      ask(preset);
      router.replace("/chat");
    }, 350);
    return () => clearTimeout(id);
    // Runs once per question from the URL; `ask` is read at that moment on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  function newChat() {
    const old = clearChat();
    setFollowUps([]);
    setStreaming(null);
    if (old.length) toast("گفت‌وگوی تازه", { label: "برگردون", run: () => restoreChat(old) });
    input.current?.focus();
  }

  return (
    <motion.main
      className="bg-app relative min-h-dvh"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header: back, who this is, a new conversation */}
      <header className="bar-glass fixed inset-x-0 top-0 z-30 mx-auto grid max-w-[480px] grid-cols-[44px_1fr_44px] items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),10px)] pb-2.5">
        {messages.length ? (
          <motion.button
            type="button"
            aria-label="گفت‌وگوی تازه"
            onClick={newChat}
            whileTap={{ scale: 0.92 }}
            transition={spring}
            className="glass grid size-11 place-items-center rounded-full text-text-brand"
          >
            <SquarePen size={19} />
          </motion.button>
        ) : (
          <span />
        )}
        <div className="flex min-w-0 flex-col items-center text-center">
          <h1 className="flex items-center gap-1.5 text-body-strong text-text-primary">
            <Sparkles size={15} className="text-text-brand" />
            دستیار دوزیار
          </h1>
          <p className="truncate text-caption-small text-text-secondary">جواب‌های عمومی، نه توصیه‌ی پزشکی</p>
        </div>
        <motion.button
          type="button"
          aria-label="بازگشت"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/today"))}
          whileTap={{ scale: 0.92 }}
          transition={spring}
          className="glass grid size-11 place-items-center rounded-full text-text-primary"
        >
          <ChevronBack size={22} />
        </motion.button>
      </header>

      <div
        role="log"
        aria-live="polite"
        aria-busy={busy}
        aria-label="گفت‌وگو با دستیار"
        className="mx-auto flex max-w-[480px] flex-col gap-3 px-4 pt-[calc(max(env(safe-area-inset-top),10px)+76px)]"
        style={{ paddingBottom: composerHeight + keyboard + 16 }}
      >
        {messages.length === 0 && !thinking ? (
          <Welcome name={name} starters={starters} onAsk={ask} />
        ) : null}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <Message
              key={m.id}
              message={m}
              words={streaming?.id === m.id ? streaming.words : null}
            />
          ))}
          {thinking ? <Typing key="typing" /> : null}
        </AnimatePresence>

        {!busy && followUps.length && last?.role === "assistant" ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="flex flex-wrap gap-2 ps-9"
            role="group"
            aria-label="سؤال‌های بعدی"
          >
            {followUps.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => ask(f)}
                className="min-h-10 rounded-full border border-violet-200 bg-surface px-4 py-2 text-start text-caption text-text-brand transition-colors active:bg-surface-brand-subtle"
              >
                {f}
              </button>
            ))}
          </motion.div>
        ) : null}
      </div>

      {/* Composer, riding on top of the keyboard */}
      <div
        ref={composer}
        className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-linear-to-t from-bg-canvas from-60% to-bg-canvas/0 px-4 pt-6 transition-[padding] duration-200 ease-out-soft"
        style={{ paddingBottom: keyboard > 0 ? keyboard + 10 : "max(env(safe-area-inset-bottom), 14px)" }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (streaming) setStreaming({ id: streaming.id, words: Number.MAX_SAFE_INTEGER });
            else ask(draft);
          }}
          className="glass flex items-end gap-2 rounded-[26px] p-1.5 ps-4"
        >
          <textarea
            ref={input}
            value={draft}
            rows={1}
            maxLength={500}
            onChange={(e) => {
              setDraft(e.target.value);
              // Grow with the text, up to five lines
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                ask(draft);
              }
            }}
            enterKeyHint="send"
            placeholder="سؤالت رو بنویس…"
            aria-label="پیام به دستیار"
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-[16px] leading-relaxed text-text-primary caret-brand outline-none placeholder:text-text-tertiary"
          />
          <motion.button
            type="submit"
            aria-label={streaming ? "توقف" : "فرستادن"}
            disabled={!streaming && (!draft.trim() || thinking)}
            whileTap={{ scale: 0.9 }}
            transition={spring}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-gradient text-text-on-brand shadow-glow transition-opacity disabled:bg-none disabled:bg-violet-200 disabled:shadow-none"
          >
            {streaming ? <StopIcon size={16} /> : <ArrowUp size={20} strokeWidth={2.4} />}
          </motion.button>
        </form>
      </div>
    </motion.main>
  );
}

/** Before the first question: who this is, what it can help with, and a few questions to start. */
function Welcome({ name, starters, onAsk }: { name?: string; starters: string[]; onAsk: (q: string) => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="flex flex-col items-center pt-6 text-center"
    >
      <div className="relative grid size-24 place-items-center">
        <div aria-hidden="true" className="halo absolute -inset-5" />
        <Image src={bubbleIcon} alt="" width={96} height={96} className="relative size-24 object-contain" />
      </div>
      <h2 className="mt-4 text-title-large text-balance text-text-primary">
        {name ? `سلام ${name}، چی می‌خوای بدونی؟` : "سلام! چی می‌خوای بدونی؟"}
      </h2>
      <p className="mt-1.5 text-body-small text-balance text-text-secondary">
        درباره‌ی داروت، عوارض، تغذیه یا همین برنامه بپرس. جواب‌ها عمومی‌ان و جای پزشکت رو نمی‌گیرن.
      </p>
      <div className="mt-6 flex w-full flex-col gap-2.5" role="group" aria-label="پیشنهادها">
        {starters.map((s) => (
          <motion.button
            key={s}
            type="button"
            onClick={() => onAsk(s)}
            whileTap={{ scale: 0.98 }}
            transition={spring}
            className="flex min-h-14 w-full items-center gap-3 rounded-[18px] border border-violet-100 bg-surface px-4 py-3 text-start text-body-small text-text-primary shadow-[0_1px_2px_rgb(30_27_51/0.03)] active:bg-surface-brand-subtle"
          >
            <Sparkles size={16} className="shrink-0 text-text-brand" />
            <span className="flex-1">{s}</span>
            <ChevronBack size={16} className="shrink-0 text-text-tertiary" aria-hidden="true" />
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}

/** Splits text into paragraphs and «•» lists; a block can start with a line and go on as a list. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").flatMap((block, i) => {
        // Consecutive lines of the same kind (bullet or not) stay together.
        const groups: { list: boolean; lines: string[] }[] = [];
        for (const line of block.split("\n")) {
          const list = line.startsWith("• ");
          const last = groups.at(-1);
          if (last && last.list === list) last.lines.push(list ? line.slice(2) : line);
          else groups.push({ list, lines: [list ? line.slice(2) : line] });
        }
        return groups.map((g, j) =>
          g.list ? (
            <ul key={`${i}-${j}`} className={`flex flex-col gap-1 ${j ? "-mt-1" : ""}`}>
              {g.lines.map((l) => (
                <li key={l} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-current opacity-50" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p key={`${i}-${j}`} className="whitespace-pre-line">
              {g.lines.join("\n")}
            </p>
          ),
        );
      })}
    </>
  );
}

function Message({ message, words }: { message: ChatMessage; words: number | null }) {
  const reduce = useReducedMotion();
  const mine = message.role === "user";
  // While being written, only the words so far (whitespace kept, so lists keep their shape).
  const text = words === null ? message.text : message.text.split(/(\s+)/).slice(0, words).join("");
  const done = words === null;

  return (
    <motion.div
      layout="position"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className={`flex max-w-[88%] items-start gap-2 ${mine ? "self-end" : "self-start"}`}
      style={{ transformOrigin: mine ? "bottom left" : "bottom right" }}
    >
      {mine ? null : (
        <span
          aria-hidden="true"
          className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-brand-gradient text-white shadow-[0_4px_10px_-4px_rgb(110_75_245/0.6)]"
        >
          <Sparkles size={14} />
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-2">
        <div
          className={`flex flex-col gap-2 rounded-[22px] px-4 py-3 text-body-small text-pretty ${
            mine
              ? "rounded-ee-[8px] bg-brand-gradient text-text-on-brand shadow-[0_6px_16px_-10px_rgb(88_53_220/0.7)]"
              : message.urgent
                ? "rounded-ss-[8px] border border-danger/20 bg-danger-subtle text-text-primary"
                : "rounded-ss-[8px] border border-violet-100 bg-surface text-text-primary"
          }`}
        >
          {message.urgent ? (
            <p className="flex items-center gap-1.5 text-label text-danger">
              <AlertCircle size={16} />
              مهم
            </p>
          ) : null}
          <Rich text={text} />
        </div>
        {done && message.links?.length ? (
          <div className="flex flex-wrap gap-2">
            {message.links.map((l) => (
              <LinkChip key={l.href + l.label} link={l} />
            ))}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function LinkChip({ link }: { link: ChatLink }) {
  const call = link.href.startsWith("tel:");
  const className = `flex h-10 items-center gap-1.5 rounded-full px-4 text-caption font-semibold transition-colors ${
    call ? "bg-danger text-white active:bg-danger/90" : "bg-surface-brand-soft text-text-brand active:bg-violet-200"
  }`;
  if (call) {
    return (
      <a href={link.href} className={className}>
        <PhoneCall size={15} />
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className={className}>
      {link.label}
      <ChevronBack size={15} />
    </Link>
  );
}

/** The assistant is writing: three dots that rise in turn (a soft pulse with reduced motion). */
function Typing() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={spring}
      className="flex items-center gap-2 self-start"
      role="status"
      aria-label="دستیار داره می‌نویسه"
    >
      <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-brand-gradient text-white">
        <Sparkles size={14} />
      </span>
      <span className="flex h-11 items-center gap-1.5 rounded-[22px] rounded-ss-[8px] border border-violet-100 bg-surface px-4">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-violet-400"
            animate={reduce ? { opacity: [0.35, 1, 0.35] } : { y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </span>
    </motion.div>
  );
}
