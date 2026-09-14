"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatButton } from "@/components/chat/ChatButton";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { mockChatService } from "@/lib/chat/mock-chat-service";
import type { ChatMessage, ConversationState } from "@/lib/chat/types";
import { onOpenChatWidget } from "@/lib/chat/widget-events";
import { SUGGESTED_QUESTIONS } from "@/lib/chat/translations";
import { appendMessage, createConversation, linkLead } from "@/lib/storage/conversations";
import { addLead, getLeads } from "@/lib/storage/leads";
import { getSettings } from "@/lib/storage/settings";

/**
 * The floating "Ask Adria" widget. Owns all conversation state and talks
 * to `mockChatService` through the shared `ChatService` interface — swap
 * that import for a real backend later without touching this component.
 */
export function ChatWidget() {
  const [mockAiEnabled, setMockAiEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [convoState, setConvoState] = useState<ConversationState>(() =>
    mockChatService.createInitialState("en"),
  );
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[] | undefined>(undefined);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const ensureConversation = useCallback((): string => {
    if (conversationId) return conversationId;
    const conversation = createConversation(convoState.language);
    const greeting = mockChatService.getGreeting(convoState.language);
    appendMessage(conversation.id, greeting);
    setConversationId(conversation.id);
    setMessages([greeting]);
    return conversation.id;
  }, [conversationId, convoState.language]);

  const handleSend = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text) return;
      const activeConversationId = ensureConversation();

      const userMessage: ChatMessage = {
        id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: "user",
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      appendMessage(activeConversationId, userMessage);
      setQuickReplies(undefined);
      setIsLoading(true);

      try {
        const result = await mockChatService.sendMessage({
          message: text,
          state: convoState,
          history: messages,
          nextLeadSequence: getLeads().length + 1,
        });

        setMessages((prev) => [...prev, ...result.messages]);
        result.messages.forEach((message) => appendMessage(activeConversationId, message));
        setConvoState(result.state);
        setQuickReplies(result.suggestedReplies);

        if (result.leadDraft && result.leadReference) {
          const lead = addLead(
            {
              source: result.leadDraft.source,
              name: result.leadDraft.name,
              contact: result.leadDraft.contact,
              checkIn: result.leadDraft.checkIn,
              checkOut: result.leadDraft.checkOut,
              guests: result.leadDraft.guests,
              note: result.leadDraft.note,
              question: result.leadDraft.question,
              language: result.leadDraft.language,
              conversationId: activeConversationId,
            },
            result.leadReference,
          );
          linkLead(activeConversationId, lead.id);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [convoState, messages, ensureConversation],
  );

  const hasOpenedRef = useRef(false);

  const handleOpen = useCallback(() => {
    hasOpenedRef.current = true;
    setIsOpen(true);
    ensureConversation();
  }, [ensureConversation]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Return focus to the toggle button after the window closes (it isn't
  // mounted while the window is open, so this can't happen synchronously).
  useEffect(() => {
    if (!isOpen && hasOpenedRef.current) {
      toggleButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Keep refs to the latest callbacks/state so the one-time window-event
  // listener below never closes over stale values.
  const handleOpenRef = useRef(handleOpen);
  const handleSendRef = useRef(handleSend);
  const convoStateRef = useRef(convoState);
  useEffect(() => {
    handleOpenRef.current = handleOpen;
    handleSendRef.current = handleSend;
    convoStateRef.current = convoState;
  }, [handleOpen, handleSend, convoState]);

  // Let landing-page CTAs ("Check availability") open the widget and,
  // optionally, jump straight into the booking-enquiry flow.
  useEffect(() => {
    return onOpenChatWidget(({ startBooking }) => {
      handleOpenRef.current();
      if (startBooking) {
        const language = convoStateRef.current.language;
        const availabilityPrompt = SUGGESTED_QUESTIONS[language][SUGGESTED_QUESTIONS[language].length - 1];
        // Defer slightly so the greeting message renders first.
        window.setTimeout(() => handleSendRef.current(availabilityPrompt), 150);
      }
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  // Respect the "Mock AI enabled" dashboard setting, including changes
  // made from another tab (e.g. the owner toggling it in /dashboard).
  useEffect(() => {
    // Intentional one-time hydration from LocalStorage, unavailable
    // during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMockAiEnabled(getSettings().mockAiEnabled);
    function onStorage() {
      setMockAiEnabled(getSettings().mockAiEnabled);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!mockAiEnabled) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-end px-4 pb-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:px-0">
      {isOpen ? (
        <div className="h-[min(70vh,640px)] w-full max-w-sm animate-fade-slide-up">
          <ChatWindow
            messages={messages}
            language={convoState.language}
            isLoading={isLoading}
            quickReplies={quickReplies}
            showSuggestedQuestions={convoState.flow === null}
            onSend={handleSend}
            onClose={handleClose}
            onMinimize={handleClose}
            mode="dialog"
          />
        </div>
      ) : (
        <ChatButton ref={toggleButtonRef} onClick={handleOpen} />
      )}
    </div>
  );
}
