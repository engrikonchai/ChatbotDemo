import type {
  ChatMessage,
  ChatService,
  ConversationState,
  Intent,
  Language,
  LeadDraft,
  SendMessageParams,
  SendMessageResult,
} from "@/lib/chat/types";
import { detectIntent } from "@/lib/chat/intent-detection";
import { containsAnyKeyword, resolveLanguage } from "@/lib/chat/language-detection";
import { FAQ_ANSWERS } from "@/lib/chat/knowledge";
import {
  BOOKING_FLOW_TEXT,
  CANCEL_CONFIRMATION,
  CANCEL_KEYWORDS,
  GREETING,
  GREETING_REPLY,
  HANDOFF_FLOW_TEXT,
  UNKNOWN_FALLBACK,
  WIDGET_TEXT,
} from "@/lib/chat/translations";
import { processBookingStep } from "@/lib/chat/booking-flow";
import { processHandoffStep } from "@/lib/chat/handoff-flow";
import { generateId, generateLeadReference } from "@/lib/utils/id";

function isCancelWord(text: string, language: Language): boolean {
  return containsAnyKeyword(text, CANCEL_KEYWORDS[language]);
}

function makeMessage(text: string, language: Language, intent?: Intent): ChatMessage {
  return {
    id: generateId("msg"),
    role: "assistant",
    text,
    timestamp: Date.now(),
    language,
    intent,
  };
}

function faqAnswer(intent: Intent, language: Language): string | null {
  return FAQ_ANSWERS[intent]?.[language] ?? null;
}

class MockChatService implements ChatService {
  createInitialState(language: Language = "en"): ConversationState {
    return { language, flow: null };
  }

  getGreeting(language: Language): ChatMessage {
    return makeMessage(GREETING[language], language, "greeting");
  }

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const { message, state, nextLeadSequence } = params;
    const trimmed = message.trim();
    const language = resolveLanguage(trimmed, state.language);

    // A cancel word always wins, regardless of which flow is active.
    if (state.flow && isCancelWord(trimmed, language)) {
      const nextState: ConversationState = { language, flow: null };
      return {
        messages: [makeMessage(CANCEL_CONFIRMATION[language], language)],
        state: nextState,
      };
    }

    if (state.flow === "booking") {
      return this.continueBooking(trimmed, { ...state, language }, nextLeadSequence);
    }

    if (state.flow === "handoff") {
      return this.continueHandoff(trimmed, { ...state, language }, nextLeadSequence);
    }

    return this.startTurn(trimmed, language);
  }

  private startTurn(message: string, language: Language): SendMessageResult {
    const intent = detectIntent(message);

    if (intent === "human") {
      const t = HANDOFF_FLOW_TEXT[language];
      const nextState: ConversationState = {
        language,
        flow: "handoff",
        handoffStep: "contact",
        handoffDraft: {},
      };
      return {
        messages: [makeMessage(t.intro, language, intent)],
        state: nextState,
      };
    }

    if (intent === "availability") {
      const t = BOOKING_FLOW_TEXT[language];
      const nextState: ConversationState = {
        language,
        flow: "booking",
        bookingStep: "checkin",
        bookingDraft: {},
      };
      return {
        messages: [makeMessage(t.intro, language, intent)],
        state: nextState,
      };
    }

    if (intent === "greeting") {
      return {
        messages: [makeMessage(GREETING_REPLY[language], language, intent)],
        state: { language, flow: null },
      };
    }

    const answer = faqAnswer(intent, language);
    if (answer) {
      return {
        messages: [makeMessage(answer, language, intent)],
        state: { language, flow: null },
      };
    }

    // Unknown question — never invent an answer, offer hand-off instead.
    const widget = WIDGET_TEXT[language];
    return {
      messages: [makeMessage(UNKNOWN_FALLBACK[language], language, "unknown")],
      state: { language, flow: null },
      suggestedReplies: [widget.yes, widget.no],
    };
  }

  private continueBooking(
    message: string,
    state: ConversationState,
    nextLeadSequence: number,
  ): SendMessageResult {
    const language = state.language;
    const step = state.bookingStep ?? "checkin";
    const draft = state.bookingDraft ?? {};
    const outcome = processBookingStep(step, draft, message, language);

    if (outcome.submitted) {
      const reference = generateLeadReference(nextLeadSequence);
      const t = BOOKING_FLOW_TEXT[language];
      const leadDraft: LeadDraft = {
        source: "booking",
        name: outcome.draft.name,
        contact: outcome.draft.contact ?? "",
        checkIn: outcome.draft.checkIn,
        checkOut: outcome.draft.checkOut,
        guests: outcome.draft.guests,
        note: outcome.draft.note,
        language,
      };
      const successText = `${t.successHeading} ${t.successBody}\n\n${t.referenceLabel}: ${reference}\n${t.enquiryDisclaimer}`;
      return {
        messages: [makeMessage(successText, language, "availability")],
        state: { language, flow: null },
        leadDraft,
        leadReference: reference,
      };
    }

    const nextState: ConversationState = {
      language,
      flow: outcome.nextStep === "done" ? null : "booking",
      bookingStep: outcome.nextStep === "done" ? undefined : outcome.nextStep,
      bookingDraft: outcome.draft,
    };

    return {
      messages: [makeMessage(outcome.reply, language, "availability")],
      state: nextState,
      suggestedReplies: outcome.suggestedReplies,
    };
  }

  private continueHandoff(
    message: string,
    state: ConversationState,
    nextLeadSequence: number,
  ): SendMessageResult {
    const language = state.language;
    const step = state.handoffStep ?? "contact";
    const draft = state.handoffDraft ?? {};
    const outcome = processHandoffStep(step, draft, message, language);

    if (outcome.submitted) {
      const reference = generateLeadReference(nextLeadSequence);
      const t = HANDOFF_FLOW_TEXT[language];
      const leadDraft: LeadDraft = {
        source: "handoff",
        contact: outcome.draft.contact ?? "",
        question: outcome.draft.question,
        language,
      };
      const successText = `${t.successHeading} ${t.successBody} (${t.referenceLabel}: ${reference})`;
      return {
        messages: [makeMessage(successText, language, "human")],
        state: { language, flow: null },
        leadDraft,
        leadReference: reference,
      };
    }

    const nextState: ConversationState = {
      language,
      flow: outcome.nextStep === "done" ? null : "handoff",
      handoffStep: outcome.nextStep === "done" ? undefined : outcome.nextStep,
      handoffDraft: outcome.draft,
    };

    return {
      messages: [makeMessage(outcome.reply, language, "human")],
      state: nextState,
    };
  }
}

/** Singleton mock chat service. Stateless aside from this module wiring —
 * all conversation state lives in `ConversationState`, passed in and out
 * by the caller, so this is safe to use from client components. */
export const mockChatService: ChatService = new MockChatService();
