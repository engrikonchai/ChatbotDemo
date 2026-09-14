"use client";

import { useCallback, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { mockChatService } from "@/lib/chat/mock-chat-service";
import type { ChatMessage, ConversationState } from "@/lib/chat/types";

/**
 * A live, fully-functional preview of the chat widget — but ephemeral:
 * it talks to the same `mockChatService`, so it behaves identically to
 * the real widget, but never writes to LocalStorage. Refreshing the
 * page resets it, and it never appears in the leads/conversations lists.
 */
export function WidgetPreviewPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [mockChatService.getGreeting("en")]);
  const [convoState, setConvoState] = useState<ConversationState>(() =>
    mockChatService.createInitialState("en"),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[] | undefined>(undefined);
  // Ephemeral preview, never touches Supabase — just needs *a* sequence
  // number so the mock engine can format a reference in its reply text.
  const leadSequenceRef = useRef(1);

  const handleSend = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text) return;

      const userMessage: ChatMessage = {
        id: `preview_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: "user",
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setQuickReplies(undefined);
      setIsLoading(true);

      try {
        const result = await mockChatService.sendMessage({
          message: text,
          state: convoState,
          history: messages,
          nextLeadSequence: leadSequenceRef.current,
        });
        if (result.leadDraft) leadSequenceRef.current += 1;
        setMessages((prev) => [...prev, ...result.messages]);
        setConvoState(result.state);
        setQuickReplies(result.suggestedReplies);
      } finally {
        setIsLoading(false);
      }
    },
    [convoState, messages],
  );

  return (
    <div className="space-y-4">
      <Card className="flex items-start gap-3 border-adriatic/20 bg-adriatic-light/40 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-adriatic-dark" aria-hidden="true" />
        <p className="text-sm text-navy/70">
          This preview is live and fully functional, but ephemeral — nothing typed here is saved, and it
          won&apos;t appear in your leads or conversations.
        </p>
      </Card>

      <div className="mx-auto h-[600px] max-w-sm">
        <ChatWindow
          messages={messages}
          language={convoState.language}
          isLoading={isLoading}
          quickReplies={quickReplies}
          showSuggestedQuestions={convoState.flow === null}
          onSend={handleSend}
          mode="panel"
          titleId="dashboard-widget-preview-title"
        />
      </div>
    </div>
  );
}
