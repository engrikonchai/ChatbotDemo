"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatButton } from "@/components/chat/ChatButton";
import { ChatWindow } from "@/components/chat/ChatWindow";
import type { ChatMessage, Language } from "@/lib/chat/types";
import { onOpenChatWidget } from "@/lib/chat/widget-events";
import { SUGGESTED_QUESTIONS } from "@/lib/chat/translations";
import { sendWidgetMessage, startWidgetSession, type WidgetApiMessage } from "@/lib/client/widget-api";
import { clearLocalVisitorSession, getOrCreateVisitorId, getStoredConversationId, setStoredConversationId } from "@/lib/client/visitor";
import { isDevelopmentEnvironment } from "@/lib/supabase/env";
import { ASSISTANT_UNAVAILABLE_MESSAGE } from "@/lib/shared/messages";

function toChatMessage(m: WidgetApiMessage): ChatMessage {
  return {
    id: m.id,
    role: m.role === "system" ? "assistant" : m.role,
    text: m.text,
    timestamp: new Date(m.createdAt).getTime() || Date.now(),
    intent: (m.intent as ChatMessage["intent"]) ?? undefined,
  };
}

type WidgetAvailability = "not-configured" | "unavailable" | "available";

interface ChatWidgetProps {
  /**
   * The demo business's public, non-secret `businesses.public_widget_id`,
   * resolved server-side (see app/page.tsx) from the well-known slug
   * "adria-stay-budva" — never from a build-time env var, and never
   * dependent on which owner happens to be signed in. `null` means
   * Supabase isn't configured yet, or that business doesn't exist/isn't
   * active.
   */
  publicWidgetId: string | null;
}

/**
 * The floating "Ask Adria" widget. Requires no authentication — any
 * visitor can use it. All conversation state lives in Supabase; this
 * component is a thin, stateful client for the `/api/widget/session`
 * and `/api/widget/message` routes (see lib/client/widget-api.ts). The
 * mock chat engine itself still runs exactly as it did in Phase 1
 * (lib/chat/mock-chat-service.ts, unchanged) — it now just runs inside
 * those Route Handlers instead of in this component, so replies can be
 * persisted by trusted server code. Provider selection (mock vs. a
 * future real AI) happens entirely server-side — this component never
 * sees or decides that.
 */
export function ChatWidget({ publicWidgetId }: ChatWidgetProps) {
  const [availability, setAvailability] = useState<WidgetAvailability>(publicWidgetId ? "available" : "not-configured");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [language, setLanguage] = useState<Language>("en");
  const [flowActive, setFlowActive] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [widgetTitle, setWidgetTitle] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[] | undefined>(undefined);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const hasOpenedRef = useRef(false);
  const visitorIdRef = useRef<string>("");

  useEffect(() => {
    // LocalStorage isn't available during server rendering, so the
    // visitor id can only be created/read once mounted on the client.
    visitorIdRef.current = getOrCreateVisitorId();
  }, []);

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (!publicWidgetId) return null;
    if (conversationId) return conversationId;

    setIsLoading(true);
    const result = await startWidgetSession({
      publicWidgetId,
      visitorId: visitorIdRef.current,
      conversationId: getStoredConversationId() ?? undefined,
    });
    setIsLoading(false);

    if (!result.ok) {
      setAvailability("unavailable");
      return null;
    }
    if (!result.data.enabled) {
      setAvailability("unavailable");
      return null;
    }

    const { conversationId: newId, language: sessionLanguage, flowActive: sessionFlowActive, messages: sessionMessages, widget } =
      result.data;
    if (!newId) return null;

    setConversationId(newId);
    setStoredConversationId(newId);
    setLanguage(sessionLanguage ?? "en");
    setFlowActive(Boolean(sessionFlowActive));
    setMessages((sessionMessages ?? []).map(toChatMessage));
    setWidgetTitle(widget?.title);
    return newId;
  }, [publicWidgetId, conversationId]);

  const handleSend = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || !publicWidgetId) return;

      const activeConversationId = await ensureConversation();
      if (!activeConversationId) return;

      const userMessage: ChatMessage = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: "user",
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setQuickReplies(undefined);
      setIsLoading(true);

      const result = await sendWidgetMessage({
        publicWidgetId,
        visitorId: visitorIdRef.current,
        conversationId: activeConversationId,
        message: text,
      });

      setIsLoading(false);

      if (!result.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `error_${Date.now()}`,
            role: "assistant",
            text: ASSISTANT_UNAVAILABLE_MESSAGE,
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      setMessages((prev) => [...prev, ...result.data.messages.map(toChatMessage)]);
      setLanguage(result.data.language);
      setFlowActive(result.data.flowActive);
      setQuickReplies(result.data.suggestedReplies.length > 0 ? result.data.suggestedReplies : undefined);
    },
    [publicWidgetId, ensureConversation],
  );

  const handleOpen = useCallback(() => {
    hasOpenedRef.current = true;
    setIsOpen(true);
    void ensureConversation();
  }, [ensureConversation]);

  const handleClose = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen && hasOpenedRef.current) {
      toggleButtonRef.current?.focus();
    }
  }, [isOpen]);

  const ensureConversationRef = useRef(ensureConversation);
  const handleSendRef = useRef(handleSend);
  const languageRef = useRef(language);
  useEffect(() => {
    ensureConversationRef.current = ensureConversation;
    handleSendRef.current = handleSend;
    languageRef.current = language;
  }, [ensureConversation, handleSend, language]);

  useEffect(() => {
    return onOpenChatWidget(({ startBooking }) => {
      hasOpenedRef.current = true;
      setIsOpen(true);
      if (startBooking) {
        // handleSend awaits ensureConversation() itself, so it alone
        // establishes the session — calling handleOpen()'s own
        // ensureConversation() here too would race two concurrent
        // session-creation requests (that's what the old fixed 150ms
        // delay was papering over).
        const lang = languageRef.current;
        const availabilityPrompt = SUGGESTED_QUESTIONS[lang][SUGGESTED_QUESTIONS[lang].length - 1];
        void handleSendRef.current(availabilityPrompt);
      } else {
        void ensureConversationRef.current();
      }
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  if (availability === "not-configured") {
    if (!isDevelopmentEnvironment()) return null; // never show a config error to real visitors
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 shadow-card sm:bottom-6 sm:right-6">
        <p className="font-semibold">Dev only — chat widget not configured</p>
        <p className="mt-1">
          Either Supabase isn&apos;t configured, or no active business with slug &quot;adria-stay-budva&quot;
          was found. Sign up once at /signup, then check the dashboard&apos;s Settings tab. See README.md.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-end px-4 pb-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:px-0">
      {isOpen ? (
        <div className="h-[min(70vh,640px)] w-full max-w-sm animate-fade-slide-up">
          {availability === "unavailable" ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-navy/10 bg-white p-6 text-center shadow-widget">
              <p className="font-serif text-lg font-semibold text-navy">Chat is temporarily unavailable</p>
              <p className="text-sm text-navy/60">{ASSISTANT_UNAVAILABLE_MESSAGE}</p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 rounded-full bg-adriatic px-5 py-2 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>
          ) : (
            <ChatWindow
              messages={messages}
              language={language}
              isLoading={isLoading}
              quickReplies={quickReplies}
              showSuggestedQuestions={!flowActive}
              onSend={handleSend}
              onClose={handleClose}
              onMinimize={handleClose}
              mode="dialog"
              title={widgetTitle}
            />
          )}
        </div>
      ) : (
        <ChatButton ref={toggleButtonRef} onClick={handleOpen} />
      )}

      {isDevelopmentEnvironment() ? (
        <button
          type="button"
          onClick={() => {
            clearLocalVisitorSession();
            window.location.reload();
          }}
          className="absolute -top-9 right-0 rounded-full border border-navy/15 bg-white px-3 py-1 text-[11px] font-medium text-navy/50 shadow-sm hover:text-navy"
          title="Development only: forgets this browser's visitor id and current conversation"
        >
          Dev: reset visitor session
        </button>
      ) : null}
    </div>
  );
}
