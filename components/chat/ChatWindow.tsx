"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Minus, Send, Waves, X } from "lucide-react";
import type { ChatMessage, Language } from "@/lib/chat/types";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SuggestedQuestions } from "@/components/chat/SuggestedQuestions";
import { POWERED_BY_LABEL, SUGGESTED_QUESTIONS, WIDGET_TEXT } from "@/lib/chat/translations";
import { cn } from "@/lib/utils/cn";

interface ChatWindowProps {
  messages: ChatMessage[];
  language: Language;
  isLoading: boolean;
  quickReplies?: string[];
  showSuggestedQuestions: boolean;
  onSend: (text: string) => void;
  onClose?: () => void;
  onMinimize?: () => void;
  /** "dialog" renders as a modal-like floating panel; "panel" renders inline (dashboard preview). */
  mode?: "dialog" | "panel";
  titleId?: string;
  className?: string;
  /** Owner-editable assistant name (Supabase widget_settings.title). Falls back to the translated default. */
  title?: string;
}

export function ChatWindow({
  messages,
  language,
  isLoading,
  quickReplies,
  showSuggestedQuestions,
  onSend,
  onClose,
  onMinimize,
  mode = "dialog",
  titleId = "adria-chat-title",
  className,
  title,
}: ChatWindowProps) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFocusedRef = useRef(false);
  const text = WIDGET_TEXT[language];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    // A disabled input can't receive focus, and the widget often opens
    // with isLoading already true (e.g. the "Check availability" CTA
    // starts a booking message immediately) — so this can't be a
    // mount-only effect. It re-checks whenever isLoading changes and
    // focuses exactly once, the first moment the input is enabled.
    if (mode !== "dialog" || isLoading || hasFocusedRef.current) return;
    inputRef.current?.focus();
    hasFocusedRef.current = true;
  }, [mode, isLoading]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const value = draft.trim();
    if (!value || isLoading) return;
    onSend(value);
    setDraft("");
  }

  return (
    <div
      role={mode === "dialog" ? "dialog" : undefined}
      aria-modal={mode === "dialog" ? true : undefined}
      aria-labelledby={titleId}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white",
        mode === "dialog" && "shadow-widget",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-navy/10 bg-navy px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-adriatic text-white">
            <Waves className="h-5 w-5" aria-hidden="true" />
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-navy bg-green-400"
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0">
            <p id={titleId} className="truncate text-sm font-semibold text-white">
              {title || text.assistantName}
            </p>
            <p className="flex items-center gap-1.5 truncate text-xs text-white/60">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden="true" />
              {text.onlineStatus}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onMinimize ? (
            <button
              type="button"
              onClick={onMinimize}
              aria-label={text.minimize}
              className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Minus className="h-4 w-4" />
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label={text.close}
              className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex-1 space-y-3 overflow-y-auto bg-warm px-4 py-4"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-navy/10 bg-white px-4 py-2.5 text-sm text-navy/50 shadow-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span className="sr-only">Adria assistant is typing</span>
              <span aria-hidden="true">···</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Quick replies or suggested questions */}
      {quickReplies && quickReplies.length > 0 ? (
        <SuggestedQuestions
          label={text.suggestedQuestionsLabel}
          questions={quickReplies}
          onSelect={onSend}
          disabled={isLoading}
        />
      ) : showSuggestedQuestions ? (
        <SuggestedQuestions
          label={text.suggestedQuestionsLabel}
          questions={SUGGESTED_QUESTIONS[language]}
          onSelect={onSend}
          disabled={isLoading}
        />
      ) : null}

      {/* Input */}
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-navy/10 p-3">
        <label htmlFor={`${titleId}-input`} className="sr-only">
          {text.inputPlaceholder}
        </label>
        <input
          id={`${titleId}-input`}
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={text.inputPlaceholder}
          autoComplete="off"
          disabled={isLoading}
          className="min-w-0 flex-1 rounded-full border border-navy/15 bg-warm px-4 py-2.5 text-sm text-navy placeholder:text-navy/40 focus:border-adriatic focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !draft.trim()}
          aria-label={text.send}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-adriatic text-white transition-colors hover:bg-adriatic-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      <p className="border-t border-navy/5 bg-warm px-4 py-2 text-center text-[11px] text-navy/35">
        {POWERED_BY_LABEL}
      </p>
    </div>
  );
}
