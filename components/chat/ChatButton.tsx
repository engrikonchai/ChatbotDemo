"use client";

import { forwardRef } from "react";
import { MessageCircle } from "lucide-react";

interface ChatButtonProps {
  onClick: () => void;
  hasUnread?: boolean;
}

export const ChatButton = forwardRef<HTMLButtonElement, ChatButtonProps>(function ChatButton(
  { onClick, hasUnread },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-full bg-adriatic px-5 py-3.5 text-white shadow-widget transition-transform hover:-translate-y-0.5 hover:bg-adriatic-dark focus-visible:-translate-y-0.5"
      aria-label="Ask Adria — open chat with our assistant"
    >
      <span className="relative">
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        {hasUnread ? (
          <span
            className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-adriatic bg-green-400"
            aria-hidden="true"
          />
        ) : null}
      </span>
      <span className="text-sm font-semibold">Ask Adria</span>
    </button>
  );
});
