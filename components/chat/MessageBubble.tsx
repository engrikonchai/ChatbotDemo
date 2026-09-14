import type { ChatMessage } from "@/lib/chat/types";
import { cn } from "@/lib/utils/cn";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-sm bg-adriatic text-white"
            : "rounded-bl-sm border border-navy/10 bg-white text-navy",
        )}
      >
        {message.text}
      </div>
    </div>
  );
}
