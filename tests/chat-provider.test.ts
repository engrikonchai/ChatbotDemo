import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mockChatService } from "@/lib/chat/mock-chat-service";

const originalProvider = process.env.CHAT_PROVIDER;
const originalOpenAiKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  if (originalProvider === undefined) delete process.env.CHAT_PROVIDER;
  else process.env.CHAT_PROVIDER = originalProvider;
  if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalOpenAiKey;
});

describe("getChatService — server-side provider selection", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it("defaults to the mock service when CHAT_PROVIDER is unset", async () => {
    delete process.env.CHAT_PROVIDER;
    const { getChatService } = await import("@/lib/server/chat-provider");
    expect(getChatService()).toBe(mockChatService);
  });

  it('returns the mock service when CHAT_PROVIDER="mock"', async () => {
    process.env.CHAT_PROVIDER = "mock";
    const { getChatService } = await import("@/lib/server/chat-provider");
    expect(getChatService()).toBe(mockChatService);
  });

  it("works with no OPENAI_API_KEY set at all — mock mode never depends on it", async () => {
    delete process.env.OPENAI_API_KEY;
    process.env.CHAT_PROVIDER = "mock";
    const { getChatService } = await import("@/lib/server/chat-provider");
    expect(() => getChatService()).not.toThrow();
  });

  it("still works even if OPENAI_API_KEY happens to be set — mock mode ignores it", async () => {
    process.env.OPENAI_API_KEY = "sk-not-a-real-key";
    process.env.CHAT_PROVIDER = "mock";
    const { getChatService } = await import("@/lib/server/chat-provider");
    expect(getChatService()).toBe(mockChatService);
  });

  it("fails with a clear error for an unsupported provider, rather than silently falling back to mock", async () => {
    process.env.CHAT_PROVIDER = "openai";
    const { getChatService } = await import("@/lib/server/chat-provider");
    expect(() => getChatService()).toThrow(/Unsupported CHAT_PROVIDER/);
  });

  it("the unsupported-provider error never mentions OPENAI_API_KEY", async () => {
    process.env.CHAT_PROVIDER = "something-else";
    const { getChatService } = await import("@/lib/server/chat-provider");
    try {
      getChatService();
      throw new Error("expected getChatService to throw");
    } catch (error) {
      expect(String(error)).not.toMatch(/OPENAI_API_KEY/);
    }
  });
});
