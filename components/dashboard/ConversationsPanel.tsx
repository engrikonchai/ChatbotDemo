"use client";

import { useState } from "react";
import { ChevronDown, Handshake, Lock, MessageCircle, Undo2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { LANGUAGE_LABELS } from "@/lib/chat/translations";
import type { Language, ChatMessage } from "@/lib/chat/types";
import type { ConversationRow } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils/cn";
import { getConversationMessagesAction } from "@/app/dashboard/actions";

interface ConversationsPanelProps {
  conversations: ConversationRow[];
  onTakeoverChange: (id: string, takeover: boolean) => void;
  onClose: (id: string) => void;
}

function languageLabel(language: string): string {
  return LANGUAGE_LABELS[language as Language] ?? language;
}

export function ConversationsPanel({ conversations, onTakeoverChange, onClose }: ConversationsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (conversations.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-navy/55">
        No conversations yet. Open “Ask Adria” on the website to start one.
      </Card>
    );
  }

  const sorted = [...conversations].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  async function toggleExpand(conversation: ConversationRow) {
    if (expandedId === conversation.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(conversation.id);
    if (!messagesByConversation[conversation.id]) {
      setLoadingId(conversation.id);
      const rows = await getConversationMessagesAction(conversation.id);
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversation.id]: rows.map((m) => ({
          id: m.id,
          role: m.role === "system" ? "assistant" : m.role,
          text: m.content,
          timestamp: new Date(m.created_at).getTime(),
          intent: (m.intent as ChatMessage["intent"]) ?? undefined,
        })),
      }));
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {sorted.map((conversation) => {
        const isOpen = expandedId === conversation.id;
        const isClosed = conversation.status === "closed";
        return (
          <Card key={conversation.id} className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <button
                type="button"
                onClick={() => toggleExpand(conversation)}
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-adriatic-light text-adriatic-dark">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-navy">
                    {new Date(conversation.created_at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        conversation.status === "open" && "bg-green-100 text-green-700",
                        conversation.status === "closed" && "bg-navy/10 text-navy/50",
                        conversation.status === "handed_off" && "bg-amber-100 text-amber-800",
                      )}
                    >
                      {conversation.status.replace("_", " ")}
                    </span>
                  </p>
                  <p className="truncate text-xs text-navy/50">
                    {languageLabel(conversation.detected_language)}
                    {conversation.lead_created ? (
                      <span className="ml-2 rounded-full bg-adriatic-light px-2 py-0.5 font-semibold text-adriatic-dark">
                        Lead created
                      </span>
                    ) : null}
                  </p>
                </div>
                <ChevronDown
                  className={cn("ml-auto h-4 w-4 shrink-0 text-navy/40 transition-transform", isOpen && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-navy/5 px-5 py-2.5">
              <button
                type="button"
                onClick={() => onTakeoverChange(conversation.id, !conversation.human_takeover)}
                className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-3 py-1 text-xs font-medium text-navy hover:bg-sand-light"
              >
                {conversation.human_takeover ? (
                  <>
                    <Undo2 className="h-3.5 w-3.5" aria-hidden="true" /> Release to bot
                  </>
                ) : (
                  <>
                    <Handshake className="h-3.5 w-3.5" aria-hidden="true" /> Take over
                  </>
                )}
              </button>
              {!isClosed ? (
                <button
                  type="button"
                  onClick={() => onClose(conversation.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-3 py-1 text-xs font-medium text-navy hover:bg-sand-light"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Close conversation
                </button>
              ) : null}
            </div>

            {isOpen ? (
              <div className="space-y-2.5 border-t border-navy/10 bg-warm px-5 py-4">
                {loadingId === conversation.id ? (
                  <p className="text-center text-xs text-navy/45">Loading messages…</p>
                ) : (
                  (messagesByConversation[conversation.id] ?? []).map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                )}
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
