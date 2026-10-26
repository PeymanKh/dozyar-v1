"use client";

import { useSyncExternalStore } from "react";
import { newId } from "./app-store";
import { createLocalStore } from "./local-store";

/**
 * The conversation with the assistant, kept so it is still there when the person comes back.
 * Only the latest messages are kept.
 *
 * MOCK: moves to the Django API (with the real assistant) once it exists.
 */

export type ChatLink = { label: string; href: string };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Places in the app the answer points to (a food guide, a recipe, a lesson). */
  links?: ChatLink[];
  /** Red-flag answers are shown as a warning. */
  urgent?: boolean;
  at: number;
};

type ChatState = { messages: ChatMessage[] };

const KEEP = 60;
const store = createLocalStore<ChatState>("dozyar.chat", { messages: [] });

export function useChat(): ChatState {
  return useSyncExternalStore(store.subscribe, store.read, store.serverSnapshot);
}

export function addMessage(message: Omit<ChatMessage, "id" | "at">): ChatMessage {
  const full = { ...message, id: newId(), at: Date.now() };
  store.update((s) => ({ messages: [...s.messages, full].slice(-KEEP) }));
  return full;
}

/** A new conversation; returns the old one so it can be brought back (undo). */
export function clearChat(): ChatMessage[] {
  const old = store.read().messages;
  store.reset();
  return old;
}

export function restoreChat(messages: ChatMessage[]) {
  store.write({ messages });
}
