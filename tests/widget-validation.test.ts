import { describe, expect, it } from "vitest";
import {
  MAX_MESSAGE_LENGTH,
  widgetHandoffRequestSchema,
  widgetLeadRequestSchema,
  widgetMessageRequestSchema,
  widgetSessionRequestSchema,
} from "@/lib/validation/widget";

const VALID_WIDGET_ID = "11111111-1111-4111-8111-111111111111";
const VALID_CONVERSATION_ID = "22222222-2222-4222-8222-222222222222";
const VALID_VISITOR_ID = "visitor-0123456789";

describe("widgetSessionRequestSchema", () => {
  it("accepts a minimal valid request", () => {
    const result = widgetSessionRequestSchema.safeParse({
      publicWidgetId: VALID_WIDGET_ID,
      visitorId: VALID_VISITOR_ID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid widget id", () => {
    const result = widgetSessionRequestSchema.safeParse({ publicWidgetId: "not-a-uuid", visitorId: VALID_VISITOR_ID });
    expect(result.success).toBe(false);
  });

  it("rejects a visitor id that's too short", () => {
    const result = widgetSessionRequestSchema.safeParse({ publicWidgetId: VALID_WIDGET_ID, visitorId: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("widgetMessageRequestSchema — message length limit", () => {
  it("accepts a normal message", () => {
    const result = widgetMessageRequestSchema.safeParse({
      publicWidgetId: VALID_WIDGET_ID,
      visitorId: VALID_VISITOR_ID,
      conversationId: VALID_CONVERSATION_ID,
      message: "Is parking available?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty message", () => {
    const result = widgetMessageRequestSchema.safeParse({
      publicWidgetId: VALID_WIDGET_ID,
      visitorId: VALID_VISITOR_ID,
      conversationId: VALID_CONVERSATION_ID,
      message: "   ",
    });
    expect(result.success).toBe(false);
  });

  it(`rejects a message longer than ${MAX_MESSAGE_LENGTH} characters`, () => {
    const result = widgetMessageRequestSchema.safeParse({
      publicWidgetId: VALID_WIDGET_ID,
      visitorId: VALID_VISITOR_ID,
      conversationId: VALID_CONVERSATION_ID,
      message: "a".repeat(MAX_MESSAGE_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it(`accepts a message exactly ${MAX_MESSAGE_LENGTH} characters long`, () => {
    const result = widgetMessageRequestSchema.safeParse({
      publicWidgetId: VALID_WIDGET_ID,
      visitorId: VALID_VISITOR_ID,
      conversationId: VALID_CONVERSATION_ID,
      message: "a".repeat(MAX_MESSAGE_LENGTH),
    });
    expect(result.success).toBe(true);
  });
});

function baseLead(overrides: Record<string, unknown> = {}) {
  return {
    publicWidgetId: VALID_WIDGET_ID,
    visitorId: VALID_VISITOR_ID,
    name: "Ana Petrovic",
    contact: "+382 67 000 000",
    consent: true as const,
    ...overrides,
  };
}

describe("widgetLeadRequestSchema", () => {
  it("accepts a minimal valid lead", () => {
    expect(widgetLeadRequestSchema.safeParse(baseLead()).success).toBe(true);
  });

  it("rejects a lead without consent", () => {
    const result = widgetLeadRequestSchema.safeParse(baseLead({ consent: false }));
    expect(result.success).toBe(false);
  });

  it("rejects a lead missing consent entirely", () => {
    const lead = baseLead() as Record<string, unknown>;
    delete lead.consent;
    const result = widgetLeadRequestSchema.safeParse(lead);
    expect(result.success).toBe(false);
  });

  it("rejects an empty name or contact", () => {
    expect(widgetLeadRequestSchema.safeParse(baseLead({ name: "" })).success).toBe(false);
    expect(widgetLeadRequestSchema.safeParse(baseLead({ contact: "" })).success).toBe(false);
  });

  it("rejects check-out before check-in", () => {
    const result = widgetLeadRequestSchema.safeParse(
      baseLead({ checkIn: "2026-06-14", checkOut: "2026-06-10" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects check-out equal to check-in", () => {
    const result = widgetLeadRequestSchema.safeParse(
      baseLead({ checkIn: "2026-06-10", checkOut: "2026-06-10" }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts check-out after check-in", () => {
    const result = widgetLeadRequestSchema.safeParse(
      baseLead({ checkIn: "2026-06-10", checkOut: "2026-06-14" }),
    );
    expect(result.success).toBe(true);
  });

  it("enforces the 1-4 guest limit", () => {
    expect(widgetLeadRequestSchema.safeParse(baseLead({ guests: 0 })).success).toBe(false);
    expect(widgetLeadRequestSchema.safeParse(baseLead({ guests: 5 })).success).toBe(false);
    expect(widgetLeadRequestSchema.safeParse(baseLead({ guests: 1 })).success).toBe(true);
    expect(widgetLeadRequestSchema.safeParse(baseLead({ guests: 4 })).success).toBe(true);
  });

  it("rejects a malformed reference", () => {
    expect(widgetLeadRequestSchema.safeParse(baseLead({ reference: "not-a-reference" })).success).toBe(false);
    expect(widgetLeadRequestSchema.safeParse(baseLead({ reference: "ASB-2026-0007" })).success).toBe(true);
  });
});

describe("widgetHandoffRequestSchema", () => {
  it("accepts a minimal valid hand-off", () => {
    const result = widgetHandoffRequestSchema.safeParse({
      publicWidgetId: VALID_WIDGET_ID,
      visitorId: VALID_VISITOR_ID,
      contact: "guest@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty contact", () => {
    const result = widgetHandoffRequestSchema.safeParse({
      publicWidgetId: VALID_WIDGET_ID,
      visitorId: VALID_VISITOR_ID,
      contact: "",
    });
    expect(result.success).toBe(false);
  });
});
