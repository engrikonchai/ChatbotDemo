/**
 * Hand-written row types mirroring the Supabase schema in
 * `supabase/migrations/*.sql`. In a real project these would be
 * generated with `supabase gen types typescript`; they're written by
 * hand here so the project has no dependency on a live Supabase project
 * or the Supabase CLI just to type-check.
 *
 * These are deliberately used as plain result-shape types (cast at the
 * query call site in lib/supabase/* and lib/server/widget-service.ts)
 * rather than threaded through `SupabaseClient<Database>`'s schema
 * generic — that generic's conditional-type resolution is fragile
 * across supabase-js versions and buys little for a project this size.
 *
 * Keep this in sync with the migrations whenever the schema changes.
 */

export type ConversationChannel = "website" | "instagram" | "whatsapp";
export type ConversationStatus = "open" | "closed" | "handed_off";
export type MessageRole = "user" | "assistant" | "system";
export type LeadStatus = "new" | "contacted" | "confirmed" | "lost";
export type LeadSource = "website" | "instagram" | "whatsapp";
export type HandoffStatus = "new" | "contacted" | "resolved";
export type WidgetPosition = "bottom-right" | "bottom-left";

export interface ProfileRow {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessRow {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  public_widget_id: string;
  business_type: string;
  location: string | null;
  default_language: string;
  supported_languages: string[];
  handoff_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeItemRow {
  id: string;
  business_id: string;
  category: string;
  question: string;
  answer_en: string;
  answer_me: string | null;
  answer_ru: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationRow {
  id: string;
  business_id: string;
  visitor_id: string;
  channel: ConversationChannel;
  detected_language: string;
  status: ConversationStatus;
  human_takeover: boolean;
  lead_created: boolean;
  /**
   * Serialized `ConversationState` (see lib/chat/types.ts) minus what's
   * already normalized into `detected_language` — holds the in-progress
   * booking/hand-off flow step + draft so a stateless HTTP request can
   * resume exactly where the last one left off. Not part of the brief's
   * literal table spec; added because there is nowhere else to persist
   * this and the mock engine now runs server-side (see README's "Phase
   * 2 implementation notes").
   */
  flow_state: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  intent: string | null;
  created_at: string;
}

export interface LeadRow {
  id: string;
  business_id: string;
  conversation_id: string | null;
  reference: string;
  name: string;
  contact: string;
  check_in: string | null;
  check_out: string | null;
  guest_count: number | null;
  note: string | null;
  language: string;
  source: LeadSource;
  status: LeadStatus;
  consent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HandoffRow {
  id: string;
  business_id: string;
  conversation_id: string | null;
  customer_name: string | null;
  contact: string;
  question: string | null;
  reason: string | null;
  status: HandoffStatus;
  created_at: string;
  updated_at: string;
}

export interface WidgetSettingsRow {
  id: string;
  business_id: string;
  title: string;
  welcome_message_en: string | null;
  welcome_message_me: string | null;
  welcome_message_ru: string | null;
  primary_color: string;
  position: WidgetPosition;
  mock_ai_enabled: boolean;
  human_handoff_enabled: boolean;
  created_at: string;
  updated_at: string;
}
