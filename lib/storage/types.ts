import type { ChatMessage, Language } from "@/lib/chat/types";

export type LeadStatus = "new" | "contacted" | "confirmed" | "lost";
export type LeadSource = "booking" | "handoff" | "sample";

/** A booking or hand-off enquiry, as shown in the owner dashboard. */
export interface Lead {
  /** Human-readable reference, also used as the storage id, e.g. ASB-2026-0007 */
  id: string;
  source: LeadSource;
  /** Not collected during the human hand-off flow, only during booking enquiries. */
  name?: string;
  contact: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  note?: string;
  question?: string;
  language: Language;
  status: LeadStatus;
  createdAt: number;
  conversationId?: string;
}

export type NewLeadInput = Omit<Lead, "id" | "status" | "createdAt"> & {
  createdAt?: number;
};

/** A single stored chat session, as shown in the owner dashboard. */
export interface StoredConversation {
  id: string;
  startedAt: number;
  updatedAt: number;
  language: Language;
  messages: ChatMessage[];
  leadId?: string;
}

export interface AppSettings {
  mockAiEnabled: boolean;
  supportedLanguages: Language[];
  humanHandoffEnabled: boolean;
  availabilityConfirmationRequired: boolean;
}
