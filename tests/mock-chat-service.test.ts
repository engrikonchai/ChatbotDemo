import { describe, expect, it } from "vitest";
import { mockChatService } from "@/lib/chat/mock-chat-service";
import type { ConversationState } from "@/lib/chat/types";
import { toISODate } from "@/lib/utils/date";

function futureISODate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return toISODate(date);
}

describe("mockChatService.getGreeting", () => {
  it("returns the exact prepared greeting for English", () => {
    const greeting = mockChatService.getGreeting("en");
    expect(greeting.text).toContain("I'm the Adria Stay assistant");
    expect(greeting.role).toBe("assistant");
  });
});

describe("mockChatService unknown-question fallback", () => {
  it("never invents an answer and offers to contact the host instead", async () => {
    const state = mockChatService.createInitialState("en");
    const result = await mockChatService.sendMessage({
      message: "Do you have a swimming pool on the roof?",
      state,
      history: [],
      nextLeadSequence: 1,
    });

    expect(result.messages[0].text).toContain("I don't have verified information");
    expect(result.messages[0].intent).toBe("unknown");
    expect(result.suggestedReplies).toBeDefined();
    expect(result.leadDraft).toBeUndefined();
  });
});

describe("mockChatService refuses to confirm availability directly", () => {
  it("never says yes/no to availability — it always starts the booking enquiry flow", async () => {
    const state = mockChatService.createInitialState("en");
    const result = await mockChatService.sendMessage({
      message: "I want to check availability",
      state,
      history: [],
      nextLeadSequence: 1,
    });

    const text = result.messages[0].text.toLowerCase();
    expect(text).toContain("only the host can");
    expect(text).not.toMatch(/\byes\b/);
    expect(result.state.flow).toBe("booking");
    expect(result.state.bookingStep).toBe("checkin");
  });

  it("never invents an airport transfer or apartment price", async () => {
    const state = mockChatService.createInitialState("en");

    const priceResult = await mockChatService.sendMessage({
      message: "How much does it cost per night?",
      state,
      history: [],
      nextLeadSequence: 1,
    });
    expect(priceResult.messages[0].text).not.toMatch(/€|\$|\d+\s*(eur|euros)/i);

    const transferResult = await mockChatService.sendMessage({
      message: "How much is an airport transfer?",
      state,
      history: [],
      nextLeadSequence: 1,
    });
    expect(transferResult.messages[0].text.toLowerCase()).toContain("confirm");
  });
});

describe("mockChatService booking-enquiry flow", () => {
  it("collects every step in order, validates input, and produces a lead on confirmation", async () => {
    let state: ConversationState = mockChatService.createInitialState("en");
    const history: never[] = [];

    const start = await mockChatService.sendMessage({
      message: "I want to check availability",
      state,
      history,
      nextLeadSequence: 7,
    });
    state = start.state;
    expect(state.bookingStep).toBe("checkin");

    // Invalid: date in the past.
    const rejectedPast = await mockChatService.sendMessage({
      message: "2000-01-01",
      state,
      history,
      nextLeadSequence: 7,
    });
    expect(rejectedPast.state.bookingStep).toBe("checkin");

    const checkIn = futureISODate(10);
    const afterCheckIn = await mockChatService.sendMessage({
      message: checkIn,
      state,
      history,
      nextLeadSequence: 7,
    });
    state = afterCheckIn.state;
    expect(state.bookingStep).toBe("checkout");

    // Invalid: check-out before check-in.
    const rejectedRange = await mockChatService.sendMessage({
      message: futureISODate(2),
      state,
      history,
      nextLeadSequence: 7,
    });
    expect(rejectedRange.state.bookingStep).toBe("checkout");

    const checkOut = futureISODate(14);
    const afterCheckOut = await mockChatService.sendMessage({
      message: checkOut,
      state,
      history,
      nextLeadSequence: 7,
    });
    state = afterCheckOut.state;
    expect(state.bookingStep).toBe("guests");

    // Invalid guest count.
    const rejectedGuests = await mockChatService.sendMessage({
      message: "10",
      state,
      history,
      nextLeadSequence: 7,
    });
    expect(rejectedGuests.state.bookingStep).toBe("guests");

    const afterGuests = await mockChatService.sendMessage({
      message: "2",
      state,
      history,
      nextLeadSequence: 7,
    });
    state = afterGuests.state;
    expect(state.bookingStep).toBe("name");

    const afterName = await mockChatService.sendMessage({
      message: "Ana Petrovic",
      state,
      history,
      nextLeadSequence: 7,
    });
    state = afterName.state;
    expect(state.bookingStep).toBe("contact");

    const afterContact = await mockChatService.sendMessage({
      message: "+382 67 000 000",
      state,
      history,
      nextLeadSequence: 7,
    });
    state = afterContact.state;
    expect(state.bookingStep).toBe("note");

    const afterNote = await mockChatService.sendMessage({
      message: "skip",
      state,
      history,
      nextLeadSequence: 7,
    });
    state = afterNote.state;
    expect(state.bookingStep).toBe("confirm");
    expect(afterNote.messages[0].text).toContain("not a confirmed reservation");

    const confirmed = await mockChatService.sendMessage({
      message: "yes",
      state,
      history,
      nextLeadSequence: 7,
    });

    expect(confirmed.leadDraft).toBeDefined();
    expect(confirmed.leadDraft?.source).toBe("booking");
    expect(confirmed.leadDraft?.contact).toBe("+382 67 000 000");
    expect(confirmed.leadReference).toMatch(/^ASB-\d{4}-0007$/);
    expect(confirmed.state.flow).toBeNull();
  });

  it("cancels the flow when the visitor says cancel", async () => {
    const start = await mockChatService.sendMessage({
      message: "I want to check availability",
      state: mockChatService.createInitialState("en"),
      history: [],
      nextLeadSequence: 1,
    });

    const cancelled = await mockChatService.sendMessage({
      message: "cancel",
      state: start.state,
      history: [],
      nextLeadSequence: 1,
    });

    expect(cancelled.state.flow).toBeNull();
    expect(cancelled.leadDraft).toBeUndefined();
  });
});

describe("mockChatService human hand-off flow", () => {
  it("collects contact and question, then produces a hand-off lead", async () => {
    const start = await mockChatService.sendMessage({
      message: "I'd like to speak to the owner",
      state: mockChatService.createInitialState("en"),
      history: [],
      nextLeadSequence: 3,
    });
    expect(start.state.flow).toBe("handoff");

    const afterContact = await mockChatService.sendMessage({
      message: "guest@example.com",
      state: start.state,
      history: [],
      nextLeadSequence: 3,
    });
    expect(afterContact.state.handoffStep).toBe("question");

    const afterQuestion = await mockChatService.sendMessage({
      message: "Can I bring an extra guest for one night?",
      state: afterContact.state,
      history: [],
      nextLeadSequence: 3,
    });

    expect(afterQuestion.leadDraft?.source).toBe("handoff");
    expect(afterQuestion.leadDraft?.contact).toBe("guest@example.com");
    expect(afterQuestion.leadReference).toMatch(/^ASB-\d{4}-0003$/);
    expect(afterQuestion.state.flow).toBeNull();
  });
});
