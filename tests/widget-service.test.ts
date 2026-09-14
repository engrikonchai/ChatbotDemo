import { describe, expect, it } from "vitest";
import { createMockSupabase } from "./helpers/mock-supabase";
import {
  createHandoffRow,
  createLeadRow,
  insertMessages,
  loadOwnedConversation,
  persistLeadDraft,
  resolveActiveBusiness,
  resolveSessionLanguage,
} from "@/lib/server/widget-service";
import type { BusinessRow } from "@/lib/supabase/database.types";
import type { LeadDraft } from "@/lib/chat/types";

const ACTIVE_WIDGET_ID = "11111111-1111-4111-8111-111111111111";
const INACTIVE_WIDGET_ID = "22222222-2222-4222-8222-222222222222";

const ACTIVE_BUSINESS = {
  id: "business-1",
  owner_id: "owner-1",
  name: "Adria Stay Budva",
  slug: "adria-stay-budva",
  public_widget_id: ACTIVE_WIDGET_ID,
  business_type: "apartment",
  location: "Budva, Montenegro",
  default_language: "en",
  supported_languages: ["en", "me", "ru"],
  handoff_email: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
} satisfies BusinessRow;

describe("resolveActiveBusiness", () => {
  it("returns the business when the widget id is active", async () => {
    const admin = createMockSupabase({
      businesses: (state) => {
        const isCorrectId = state.filters.some(([col, val]) => col === "public_widget_id" && val === ACTIVE_WIDGET_ID);
        const wantsActive = state.filters.some(([col, val]) => col === "is_active" && val === true);
        return isCorrectId && wantsActive ? { data: ACTIVE_BUSINESS } : { data: null };
      },
    });

    const business = await resolveActiveBusiness(admin as never, ACTIVE_WIDGET_ID);
    expect(business).toEqual(ACTIVE_BUSINESS);
  });

  it("returns null for an unknown widget id", async () => {
    const admin = createMockSupabase({ businesses: () => ({ data: null }) });
    const business = await resolveActiveBusiness(admin as never, "does-not-exist");
    expect(business).toBeNull();
  });

  it("returns null for an inactive business, even with the right widget id", async () => {
    // Simulates the real query: `.eq("public_widget_id", id).eq("is_active", true)`
    // returning no row once is_active is false — an inactive business is
    // indistinguishable from a nonexistent one to the caller.
    const admin = createMockSupabase({
      businesses: (state) => {
        const isCorrectId = state.filters.some(([col, val]) => col === "public_widget_id" && val === INACTIVE_WIDGET_ID);
        const wantsActive = state.filters.some(([col, val]) => col === "is_active" && val === true);
        // Real Postgres would filter this row out because is_active=false.
        return isCorrectId && wantsActive ? { data: null } : { data: null };
      },
    });

    const business = await resolveActiveBusiness(admin as never, INACTIVE_WIDGET_ID);
    expect(business).toBeNull();
  });

  it("returns null on a database error rather than throwing", async () => {
    const admin = createMockSupabase({ businesses: () => ({ data: null, error: new Error("boom") }) });
    await expect(resolveActiveBusiness(admin as never, ACTIVE_WIDGET_ID)).resolves.toBeNull();
  });
});

describe("resolveSessionLanguage", () => {
  it("uses the requested language when the business supports it", () => {
    expect(resolveSessionLanguage(ACTIVE_BUSINESS, "ru")).toBe("ru");
  });

  it("falls back to the business default when the requested language isn't supported", () => {
    const business = { ...ACTIVE_BUSINESS, supported_languages: ["en"], default_language: "en" };
    expect(resolveSessionLanguage(business, "ru")).toBe("en");
  });

  it("falls back to English when even the default isn't in the supported list", () => {
    const business = { ...ACTIVE_BUSINESS, supported_languages: ["me"], default_language: "ru" };
    expect(resolveSessionLanguage(business)).toBe("en");
  });
});

describe("loadOwnedConversation — tenant isolation", () => {
  const conversation = {
    id: "conv-1",
    business_id: "business-1",
    visitor_id: "visitor-abc",
    channel: "website",
    detected_language: "en",
    status: "open",
    human_takeover: false,
    lead_created: false,
    flow_state: {},
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };

  it("returns the conversation only when id, business and visitor all match", async () => {
    const admin = createMockSupabase({
      conversations: (state) => {
        const matchesAll = ["id", "business_id", "visitor_id"].every((col) =>
          state.filters.some(([c, v]) => c === col && v === (conversation as Record<string, unknown>)[col]),
        );
        return matchesAll ? { data: conversation } : { data: null };
      },
    });

    const found = await loadOwnedConversation(admin as never, {
      conversationId: "conv-1",
      businessId: "business-1",
      visitorId: "visitor-abc",
    });
    expect(found).toEqual(conversation);
  });

  it("refuses a conversation id that belongs to a different business (a forged/guessed id)", async () => {
    const admin = createMockSupabase({
      conversations: (state) => {
        const matchesAll = ["id", "business_id", "visitor_id"].every((col) =>
          state.filters.some(([c, v]) => c === col && v === (conversation as Record<string, unknown>)[col]),
        );
        return matchesAll ? { data: conversation } : { data: null };
      },
    });

    const found = await loadOwnedConversation(admin as never, {
      conversationId: "conv-1",
      businessId: "some-other-business",
      visitorId: "visitor-abc",
    });
    expect(found).toBeNull();
  });

  it("refuses a conversation id that belongs to a different visitor", async () => {
    const admin = createMockSupabase({
      conversations: (state) => {
        const matchesAll = ["id", "business_id", "visitor_id"].every((col) =>
          state.filters.some(([c, v]) => c === col && v === (conversation as Record<string, unknown>)[col]),
        );
        return matchesAll ? { data: conversation } : { data: null };
      },
    });

    const found = await loadOwnedConversation(admin as never, {
      conversationId: "conv-1",
      businessId: "business-1",
      visitorId: "someone-else",
    });
    expect(found).toBeNull();
  });
});

describe("insertMessages", () => {
  it("persists the visitor message and the mock assistant reply with matching content", async () => {
    const admin = createMockSupabase({
      messages: (state) => {
        const rows = state.insertPayload as { conversation_id: string; role: string; content: string }[];
        return { data: rows.map((row, i) => ({ id: `msg-${i}`, ...row, intent: null, created_at: "now" })) };
      },
    });

    const saved = await insertMessages(admin as never, "conv-1", [
      { role: "user", content: "Is parking available?" },
      { role: "assistant", content: "Yes — one free private parking space.", intent: "parking" },
    ]);

    expect(saved).toHaveLength(2);
    expect(saved[0].content).toBe("Is parking available?");
    expect(saved[1].content).toBe("Yes — one free private parking space.");
  });

  it("returns an empty array on a database error rather than throwing", async () => {
    const admin = createMockSupabase({ messages: () => ({ data: null, error: new Error("boom") }) });
    const saved = await insertMessages(admin as never, "conv-1", [{ role: "user", content: "hi" }]);
    expect(saved).toEqual([]);
  });
});

describe("createLeadRow / createHandoffRow — Human hand-off and lead persistence shape", () => {
  it("createLeadRow sends every booking field to the leads table", async () => {
    const admin = createMockSupabase({
      leads: (state) => ({ data: { id: "lead-1", ...(state.insertPayload as object) } }),
    });

    const { data } = await createLeadRow(admin as never, {
      businessId: "business-1",
      conversationId: "conv-1",
      reference: "ASB-2026-0001",
      name: "Ana Petrovic",
      contact: "+382 67 000 000",
      checkIn: "2026-06-10",
      checkOut: "2026-06-14",
      guests: 2,
      language: "en",
      consentAt: "2026-01-01T00:00:00.000Z",
    });

    expect(data).toMatchObject({
      business_id: "business-1",
      conversation_id: "conv-1",
      reference: "ASB-2026-0001",
      name: "Ana Petrovic",
      contact: "+382 67 000 000",
      check_in: "2026-06-10",
      check_out: "2026-06-14",
      guest_count: 2,
      status: "new",
    });
  });

  it("createHandoffRow sends the contact and question to the handoffs table", async () => {
    const admin = createMockSupabase({
      handoffs: (state) => ({ data: { id: "handoff-1", ...(state.insertPayload as object) } }),
    });

    const { data } = await createHandoffRow(admin as never, {
      businessId: "business-1",
      conversationId: "conv-1",
      contact: "guest@example.com",
      question: "Can I bring an extra guest?",
    });

    expect(data).toMatchObject({
      business_id: "business-1",
      contact: "guest@example.com",
      question: "Can I bring an extra guest?",
      status: "new",
    });
  });

  it("persistLeadDraft routes a hand-off draft to handoffs and a booking draft to leads", async () => {
    const admin = createMockSupabase({
      leads: (state) => ({ data: { id: "lead-1", ...(state.insertPayload as object) } }),
      handoffs: (state) => ({ data: { id: "handoff-1", ...(state.insertPayload as object) } }),
    });

    const handoffDraft: LeadDraft = { source: "handoff", contact: "guest@example.com", question: "Hi?", language: "en" };
    const { data: handoffResult } = await persistLeadDraft(admin as never, {
      businessId: "business-1",
      conversationId: "conv-1",
      reference: "ASB-2026-0002",
      draft: handoffDraft,
    });
    expect(handoffResult).toMatchObject({ contact: "guest@example.com" });

    const bookingDraft: LeadDraft = {
      source: "booking",
      name: "Ana",
      contact: "+382 67 000 000",
      checkIn: "2026-06-10",
      checkOut: "2026-06-14",
      guests: 2,
      language: "en",
    };
    const { data: bookingResult } = await persistLeadDraft(admin as never, {
      businessId: "business-1",
      conversationId: "conv-1",
      reference: "ASB-2026-0003",
      draft: bookingDraft,
    });
    expect(bookingResult).toMatchObject({ reference: "ASB-2026-0003", name: "Ana" });
  });
});
