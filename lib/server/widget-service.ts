import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessRow, ConversationRow, WidgetSettingsRow } from "@/lib/supabase/database.types";
import type { ConversationState, Language, LeadDraft } from "@/lib/chat/types";
import { generateLeadReference } from "@/lib/utils/id";

type AdminClient = SupabaseClient;

/**
 * Resolves a business from the id the public widget sends. Returns
 * `null` for anything that isn't a real, active business — the caller
 * always turns that into the same generic 404, so a visitor (or an
 * attacker) can't distinguish "wrong id" from "disabled business".
 *
 * This is the one and only thing the public API trusts from the
 * widget as an identifier; a `business_id` is never accepted directly
 * from a request body anywhere in this codebase.
 */
export async function resolveActiveBusiness(
  admin: AdminClient,
  publicWidgetId: string,
): Promise<BusinessRow | null> {
  const { data, error } = await admin
    .from("businesses")
    .select("*")
    .eq("public_widget_id", publicWidgetId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as BusinessRow;
}

/**
 * Resolves the public landing page's business by its unique slug —
 * used server-side (never from the browser) so the page can hand the
 * chat widget a `public_widget_id` without depending on which owner
 * happens to be signed in, without requiring the visitor to be signed
 * in at all, and without a fragile build-time env var that has to be
 * copy-pasted after every sign-up. Returns `null` for a missing or
 * inactive business — callers show a developer-facing notice rather
 * than silently failing (see app/page.tsx).
 */
export async function resolveActiveBusinessBySlug(admin: AdminClient, slug: string): Promise<BusinessRow | null> {
  const { data, error } = await admin.from("businesses").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();

  if (error || !data) return null;
  return data as BusinessRow;
}

export async function getWidgetSettings(
  admin: AdminClient,
  businessId: string,
): Promise<WidgetSettingsRow | null> {
  const { data } = await admin.from("widget_settings").select("*").eq("business_id", businessId).maybeSingle();
  return (data as WidgetSettingsRow | null) ?? null;
}

/** Picks a language to use for a new session: requested, else the business default, else 'en'. */
export function resolveSessionLanguage(business: BusinessRow, requested?: Language): Language {
  const supported = business.supported_languages as Language[];
  if (requested && supported.includes(requested)) return requested;
  const fallback = business.default_language as Language;
  return supported.includes(fallback) ? fallback : "en";
}

export async function createConversationRow(
  admin: AdminClient,
  params: { businessId: string; visitorId: string; language: Language; state: ConversationState },
): Promise<ConversationRow | null> {
  const { data, error } = await admin
    .from("conversations")
    .insert({
      business_id: params.businessId,
      visitor_id: params.visitorId,
      channel: "website",
      detected_language: params.language,
      status: "open",
      flow_state: params.state as unknown as Record<string, unknown>,
    })
    .select("*")
    .single();

  if (error) return null;
  return data as ConversationRow;
}

/**
 * Loads a conversation and verifies it actually belongs to the given
 * business + visitor — the check that stops one visitor from reading or
 * continuing another visitor's conversation just by guessing/reusing a
 * conversation id.
 */
export async function loadOwnedConversation(
  admin: AdminClient,
  params: { conversationId: string; businessId: string; visitorId: string },
): Promise<ConversationRow | null> {
  const { data, error } = await admin
    .from("conversations")
    .select("*")
    .eq("id", params.conversationId)
    .eq("business_id", params.businessId)
    .eq("visitor_id", params.visitorId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ConversationRow;
}

export async function listMessages(
  admin: AdminClient,
  conversationId: string,
): Promise<{ id: string; role: string; content: string; intent: string | null; created_at: string }[]> {
  const { data, error } = await admin
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as { id: string; role: string; content: string; intent: string | null; created_at: string }[];
}

export interface MessageToInsert {
  role: "user" | "assistant" | "system";
  content: string;
  intent?: string;
}

export async function insertMessages(
  admin: AdminClient,
  conversationId: string,
  messages: MessageToInsert[],
): Promise<{ id: string; role: string; content: string; intent: string | null; created_at: string }[]> {
  if (messages.length === 0) return [];
  const { data, error } = await admin
    .from("messages")
    .insert(messages.map((m) => ({ conversation_id: conversationId, role: m.role, content: m.content, intent: m.intent ?? null })))
    .select("*");

  if (error || !data) return [];
  return data as { id: string; role: string; content: string; intent: string | null; created_at: string }[];
}

/**
 * Corrects an already-saved message's text — used only when a message
 * announced something (e.g. a lead reference) that a subsequent write
 * then failed to actually persist, so the stored transcript and the
 * dashboard never show a success that didn't happen.
 */
export async function updateMessageContent(admin: AdminClient, messageId: string, content: string): Promise<void> {
  await admin.from("messages").update({ content }).eq("id", messageId);
}

export async function updateConversationFlowState(
  admin: AdminClient,
  conversationId: string,
  params: { flowState: ConversationState; leadCreated?: boolean },
): Promise<void> {
  const update: Record<string, unknown> = {
    flow_state: params.flowState as unknown as Record<string, unknown>,
    detected_language: params.flowState.language,
  };
  if (params.leadCreated) update.lead_created = true;
  await admin.from("conversations").update(update).eq("id", conversationId);
}

export async function countLeadsForBusiness(admin: AdminClient, businessId: string): Promise<number> {
  const { count } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);
  return count ?? 0;
}

export interface CreateLeadInput {
  businessId: string;
  conversationId: string | null;
  reference: string;
  name?: string;
  contact: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  note?: string;
  language: Language;
  consentAt: string;
}

export async function createLeadRow(admin: AdminClient, input: CreateLeadInput) {
  return admin
    .from("leads")
    .insert({
      business_id: input.businessId,
      conversation_id: input.conversationId,
      reference: input.reference,
      name: input.name ?? "",
      contact: input.contact,
      check_in: input.checkIn ?? null,
      check_out: input.checkOut ?? null,
      guest_count: input.guests ?? null,
      note: input.note ?? null,
      language: input.language,
      source: "website",
      status: "new",
      consent_at: input.consentAt,
    })
    .select("*")
    .single();
}

export interface CreateHandoffInput {
  businessId: string;
  conversationId: string | null;
  customerName?: string;
  contact: string;
  question?: string;
  reason?: string;
}

export async function createHandoffRow(admin: AdminClient, input: CreateHandoffInput) {
  return admin
    .from("handoffs")
    .insert({
      business_id: input.businessId,
      conversation_id: input.conversationId,
      customer_name: input.customerName ?? null,
      contact: input.contact,
      question: input.question ?? null,
      reason: input.reason ?? null,
      status: "new",
    })
    .select("*")
    .single();
}

/**
 * Persists whatever `mockChatService.sendMessage` produced when it
 * completes a booking or hand-off flow. Called only from the trusted
 * server-side turn handler in `/api/widget/message` — the draft comes
 * from our own deterministic engine, not directly from request input,
 * but every field is still exactly what the visitor typed and was
 * already validated turn-by-turn by `lib/chat/booking-flow.ts` /
 * `handoff-flow.ts`.
 */
export async function persistLeadDraft(
  admin: AdminClient,
  params: { businessId: string; conversationId: string; reference: string; draft: LeadDraft },
) {
  const { draft } = params;
  if (draft.source === "handoff") {
    return createHandoffRow(admin, {
      businessId: params.businessId,
      conversationId: params.conversationId,
      contact: draft.contact,
      question: draft.question,
    });
  }

  return createLeadRow(admin, {
    businessId: params.businessId,
    conversationId: params.conversationId,
    reference: params.reference,
    name: draft.name,
    contact: draft.contact,
    checkIn: draft.checkIn,
    checkOut: draft.checkOut,
    guests: draft.guests,
    note: draft.note,
    language: draft.language,
    consentAt: new Date().toISOString(),
  });
}

export { generateLeadReference };
