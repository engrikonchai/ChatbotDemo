"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { LANGUAGE_LABELS } from "@/lib/chat/translations";
import type { StoredConversation } from "@/lib/storage/types";
import { cn } from "@/lib/utils/cn";

export function ConversationsPanel({ conversations }: { conversations: StoredConversation[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (conversations.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-navy/55">
        No conversations yet. Open “Ask Adria” on the website to start one.
      </Card>
    );
  }

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="space-y-3">
      {sorted.map((conversation) => {
        const isOpen = expandedId === conversation.id;
        return (
          <Card key={conversation.id} className="overflow-hidden p-0">
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : conversation.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-adriatic-light text-adriatic-dark">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy">
                    {new Date(conversation.startedAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-navy/50">
                    {conversation.messages.length} messages · {LANGUAGE_LABELS[conversation.language]}
                    {conversation.leadId ? (
                      <span className="ml-2 rounded-full bg-adriatic-light px-2 py-0.5 font-semibold text-adriatic-dark">
                        Lead created
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 text-navy/40 transition-transform", isOpen && "rotate-180")}
                aria-hidden="true"
              />
            </button>

            {isOpen ? (
              <div className="space-y-2.5 border-t border-navy/10 bg-warm px-5 py-4">
                {conversation.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
