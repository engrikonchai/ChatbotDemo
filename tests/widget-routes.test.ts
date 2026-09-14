import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabase } from "./helpers/mock-supabase";
import { __resetRateLimitsForTests } from "@/lib/server/rate-limit";
import { toISODate } from "@/lib/utils/date";

function futureISODate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return toISODate(date);
}

const ACTIVE_WIDGET_ID = "11111111-1111-4111-8111-111111111111";
const CONVERSATION_ID = "33333333-3333-4333-8333-333333333333";
const VISITOR_ID = "visitor-0123456789";

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
};

// Replaces the real service-role client with our fake query builder for
// every test in this file. `currentAdmin` is swapped out per test.
let currentAdmin: ReturnType<typeof createMockSupabase> | null = null;
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => currentAdmin,
}));

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/widget/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  __resetRateLimitsForTests();
  currentAdmin = null;
});

describe("POST /api/widget/session", () => {
  it("creates a session and persists the greeting for a valid, active widget id — homepage works for logged-out visitors", async () => {
    let messageIdCounter = 0;
    currentAdmin = createMockSupabase({
      businesses: () => ({ data: ACTIVE_BUSINESS }),
      widget_settings: () => ({ data: null }),
      conversations: (state) => ({ data: { id: CONVERSATION_ID, ...(state.insertPayload as object) } }),
      messages: (state) => {
        const rows = state.insertPayload as { conversation_id: string; role: string; content: string }[];
        return { data: rows.map((r) => ({ id: `msg-${++messageIdCounter}`, created_at: "2026-01-01T00:00:00.000Z", ...r })) };
      },
    });

    const { POST } = await import("@/app/api/widget/session/route");
    const response = await POST(jsonRequest({ publicWidgetId: ACTIVE_WIDGET_ID, visitorId: VISITOR_ID }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.enabled).toBe(true);
    expect(json.conversationId).toBe(CONVERSATION_ID);
    expect(json.messages).toHaveLength(1);
    expect(json.messages[0].role).toBe("assistant");
    // No authentication of any kind was required to reach this point.
  });

  it("rejects an invalid public_widget_id with a generic 404 — never authentication-related", async () => {
    currentAdmin = createMockSupabase({ businesses: () => ({ data: null }) });

    const { POST } = await import("@/app/api/widget/session/route");
    const response = await POST(jsonRequest({ publicWidgetId: "22222222-2222-4222-8222-222222222222", visitorId: VISITOR_ID }));
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).not.toMatch(/login|auth|sign in/i);
  });

  it("rejects an inactive business with the exact same response as an unknown one", async () => {
    // Real Postgres filters the row out via .eq("is_active", true); our
    // fake mirrors that by returning null once that filter is present.
    currentAdmin = createMockSupabase({
      businesses: (state) => {
        const wantsActive = state.filters.some(([c, v]) => c === "is_active" && v === true);
        return wantsActive ? { data: null } : { data: ACTIVE_BUSINESS };
      },
    });

    const { POST } = await import("@/app/api/widget/session/route");
    const response = await POST(jsonRequest({ publicWidgetId: ACTIVE_WIDGET_ID, visitorId: VISITOR_ID }));
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Widget not found.");
  });

  it("fails safely (no fake success) when Supabase env vars are missing", async () => {
    currentAdmin = null; // simulates createSupabaseAdminClient() returning null

    const { POST } = await import("@/app/api/widget/session/route");
    const response = await POST(jsonRequest({ publicWidgetId: ACTIVE_WIDGET_ID, visitorId: VISITOR_ID }));
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toMatch(/temporarily unavailable/i);
    expect(json.enabled).toBeUndefined();
  });

  it("does not report success when the greeting message fails to save", async () => {
    currentAdmin = createMockSupabase({
      businesses: () => ({ data: ACTIVE_BUSINESS }),
      widget_settings: () => ({ data: null }),
      conversations: (state) => ({ data: { id: CONVERSATION_ID, ...(state.insertPayload as object) } }),
      messages: () => ({ data: null, error: new Error("insert failed") }),
    });

    const { POST } = await import("@/app/api/widget/session/route");
    const response = await POST(jsonRequest({ publicWidgetId: ACTIVE_WIDGET_ID, visitorId: VISITOR_ID }));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.enabled).toBeUndefined();
  });
});

describe("POST /api/widget/message", () => {
  function setUpConversation(overrides: Record<string, unknown> = {}) {
    const conversation: Record<string, unknown> = {
      id: CONVERSATION_ID,
      business_id: ACTIVE_BUSINESS.id,
      visitor_id: VISITOR_ID,
      status: "open",
      detected_language: "en",
      flow_state: {},
      ...overrides,
    };
    let messageIdCounter = 0;
    const leads: Record<string, unknown>[] = [];

    currentAdmin = createMockSupabase({
      businesses: () => ({ data: ACTIVE_BUSINESS }),
      conversations: (state) => {
        if (state.updatePayload) {
          Object.assign(conversation, state.updatePayload);
          return { data: conversation };
        }
        const matches = state.filters.every(([col, val]) => conversation[col] === val);
        return { data: matches ? conversation : null };
      },
      messages: (state) => {
        if (!state.insertPayload) return { data: [] };
        const rows = Array.isArray(state.insertPayload) ? state.insertPayload : [state.insertPayload];
        return {
          data: rows.map((r) => ({ id: `msg-${++messageIdCounter}`, created_at: "2026-01-01T00:00:00.000Z", ...r })),
        };
      },
      leads: (state) => {
        if (state.insertPayload) {
          const row = { id: `lead-${leads.length + 1}`, ...(state.insertPayload as object) };
          leads.push(row);
          return { data: row };
        }
        return { count: leads.length };
      },
      handoffs: (state) => {
        if (state.insertPayload) return { data: { id: "handoff-1", ...(state.insertPayload as object) } };
        return { data: null };
      },
    });

    return { conversation, leads };
  }

  it("saves the visitor message and persists the mock assistant reply", async () => {
    setUpConversation();
    const { POST } = await import("@/app/api/widget/message/route");
    const response = await POST(
      jsonRequest({ publicWidgetId: ACTIVE_WIDGET_ID, visitorId: VISITOR_ID, conversationId: CONVERSATION_ID, message: "Is parking available?" }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.messages).toHaveLength(1);
    expect(json.messages[0].text.toLowerCase()).toContain("parking");
  });

  it("rejects a conversation id that doesn't belong to this business/visitor", async () => {
    setUpConversation();
    const { POST } = await import("@/app/api/widget/message/route");
    const response = await POST(
      jsonRequest({ publicWidgetId: ACTIVE_WIDGET_ID, visitorId: "someone-else-entirely", conversationId: CONVERSATION_ID, message: "hi" }),
    );
    expect(response.status).toBe(404);
  });

  it("persists a booking enquiry to the leads table by the end of the flow", async () => {
    const { leads } = setUpConversation();
    const { POST } = await import("@/app/api/widget/message/route");

    async function send(message: string) {
      const response = await POST(
        jsonRequest({ publicWidgetId: ACTIVE_WIDGET_ID, visitorId: VISITOR_ID, conversationId: CONVERSATION_ID, message }),
      );
      return response.json();
    }

    await send("I want to check availability");
    await send(futureISODate(10));
    await send(futureISODate(14));
    await send("2");
    await send("Ana Petrovic");
    await send("+382 67 000 000");
    await send("skip");
    const final = await send("yes");

    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ name: "Ana Petrovic", contact: "+382 67 000 000", guest_count: 2 });
    expect(final.leadCreated).toBe(true);
    expect(final.leadReference).toMatch(/^ASB-\d{4}-\d{4}$/);
  });

  it("never reports a lead as created if the database insert actually fails", async () => {
    setUpConversation();
    // Force every leads-table write to fail.
    currentAdmin = createMockSupabase({
      businesses: () => ({ data: ACTIVE_BUSINESS }),
      conversations: (state) => {
        if (state.updatePayload) return { data: {} };
        return {
          data: {
            id: CONVERSATION_ID,
            business_id: ACTIVE_BUSINESS.id,
            visitor_id: VISITOR_ID,
            status: "open",
            detected_language: "en",
            flow_state: {
              language: "en",
              flow: "booking",
              bookingStep: "confirm",
              bookingDraft: {
                checkIn: "2027-06-10",
                checkOut: "2027-06-14",
                guests: 2,
                name: "Ana",
                contact: "+382 67 000 000",
              },
            },
          },
        };
      },
      messages: (state) => {
        if (!state.insertPayload) return { data: [] };
        const rows = Array.isArray(state.insertPayload) ? state.insertPayload : [state.insertPayload];
        return { data: rows.map((r, i) => ({ id: `msg-${i}`, created_at: "2026-01-01T00:00:00.000Z", ...r })) };
      },
      leads: () => ({ data: null, error: new Error("unique constraint violated") }),
    });

    const { POST } = await import("@/app/api/widget/message/route");
    const response = await POST(
      jsonRequest({ publicWidgetId: ACTIVE_WIDGET_ID, visitorId: VISITOR_ID, conversationId: CONVERSATION_ID, message: "yes" }),
    );
    const json = await response.json();

    expect(json.leadCreated).toBe(false);
    expect(json.leadReference).toBeNull();
    // The reply text must not claim a reference number for a lead that
    // was never actually saved.
    expect(json.messages[0].text).not.toMatch(/ASB-\d{4}-\d{4}/);
  });
});
