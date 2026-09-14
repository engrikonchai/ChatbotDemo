import "server-only";

import { mockChatService } from "@/lib/chat/mock-chat-service";
import type { ChatService } from "@/lib/chat/types";

/**
 * Server-side-only provider selection for the `/api/widget/*` routes.
 * The browser never chooses the provider — it only ever talks to these
 * routes, which decide what generates the reply based on `CHAT_PROVIDER`.
 *
 * Deliberately does NOT look at `OPENAI_API_KEY` at all: mock mode must
 * keep working whether or not that variable exists, in every
 * environment (local, Vercel preview, Vercel production). A future
 * "openai" provider can be added to the switch below without touching
 * any call site — see ROADMAP.md Phase 3.
 */
export function getChatService(): ChatService {
  const provider = process.env.CHAT_PROVIDER || "mock";

  switch (provider) {
    case "mock":
      return mockChatService;
    default:
      // Fails loudly and specifically server-side (never silently falls
      // back to mock, which would hide a real misconfiguration) — the
      // route handler turns this into a safe, generic message for the
      // visitor and logs the real reason server-side.
      throw new Error(
        `Unsupported CHAT_PROVIDER "${provider}". Only "mock" is currently supported — see README.md.`,
      );
  }
}
