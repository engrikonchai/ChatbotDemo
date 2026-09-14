/**
 * Core types for the chat domain.
 *
 * These types define the contract between the chat widget UI and any
 * chat "brain" that implements `ChatService`. Phase 1 ships a fully
 * deterministic `mock-chat-service.ts`. A future `openai-chat-service.ts`
 * (or any server-backed service) can implement the same `ChatService`
 * interface without any changes to the widget components.
 */

/** Languages the assistant can detect and reply in. */
export type Language = "en" | "me" | "ru";

/** Recognised conversational intents. */
export type Intent =
  | "greeting"
  | "parking"
  | "checkin"
  | "checkout"
  | "pets"
  | "wifi"
  | "smoking"
  | "beach"
  | "old_town"
  | "airport_transfer"
  | "price"
  | "payment"
  | "availability"
  | "human"
  | "unknown";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  language?: Language;
  intent?: Intent;
}

/** Steps of the guided booking-enquiry flow. */
export type BookingStep =
  | "checkin"
  | "checkout"
  | "guests"
  | "name"
  | "contact"
  | "note"
  | "confirm"
  | "done";

export interface BookingDraft {
  checkIn?: string; // ISO date (YYYY-MM-DD)
  checkOut?: string; // ISO date (YYYY-MM-DD)
  guests?: number;
  name?: string;
  contact?: string;
  note?: string;
}

/** Steps of the human hand-off flow. */
export type HandoffStep = "contact" | "question" | "done";

export interface HandoffDraft {
  contact?: string;
  question?: string;
}

export type ActiveFlow = "booking" | "handoff" | null;

/** Everything the mock service needs to remember between turns. */
export interface ConversationState {
  language: Language;
  flow: ActiveFlow;
  bookingStep?: BookingStep;
  bookingDraft?: BookingDraft;
  handoffStep?: HandoffStep;
  handoffDraft?: HandoffDraft;
}

/**
 * A fully-formed lead, ready to be persisted by the caller. Shaped here
 * (rather than in lib/storage) because the mock service is the one
 * component that knows how to fill it in from a completed flow.
 */
export interface LeadDraft {
  source: "booking" | "handoff";
  name?: string;
  contact: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  note?: string;
  question?: string;
  language: Language;
}

export interface SendMessageParams {
  /** The raw text the visitor just typed or clicked. */
  message: string;
  /** Current conversation state, as returned by the previous turn. */
  state: ConversationState;
  /** Full message history so far (oldest first), for services that use it. */
  history: ChatMessage[];
  /**
   * 1-based sequence number to use if this turn produces a new lead
   * reference (e.g. `getLeads().length + 1`). Keeps reference generation
   * deterministic and testable without the service touching storage.
   */
  nextLeadSequence: number;
}

export interface SendMessageResult {
  /** Assistant message(s) to append to the conversation, in order. */
  messages: ChatMessage[];
  /** Updated conversation state to persist for the next turn. */
  state: ConversationState;
  /** Optional quick-reply chips to show under the latest message. */
  suggestedReplies?: string[];
  /** Present when this turn completed a booking or hand-off enquiry. */
  leadDraft?: LeadDraft;
  /** Human-readable enquiry reference, present alongside `leadDraft`. */
  leadReference?: string;
}

/**
 * Shared contract for any chat backend. Widget components should only
 * ever depend on this interface, never on `mock-chat-service` directly,
 * so the backend can be swapped later.
 */
export interface ChatService {
  /** Build a fresh conversation state, optionally pinned to a language. */
  createInitialState(language?: Language): ConversationState;
  /** The first message shown when a chat window opens. */
  getGreeting(language: Language): ChatMessage;
  /** Process one visitor message and produce the next turn. */
  sendMessage(params: SendMessageParams): Promise<SendMessageResult>;
}
