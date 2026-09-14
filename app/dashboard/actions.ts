"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateLeadReference } from "@/lib/utils/id";
import type { LeadStatus, HandoffStatus, ConversationStatus } from "@/lib/supabase/database.types";
import type { Language } from "@/lib/chat/types";
import { DEMO_BUSINESS_SLUG, FAQ_ANSWERS, FAQ_QUESTIONS } from "@/lib/chat/knowledge";
import { GREETING } from "@/lib/chat/translations";

/**
 * Every action below uses the caller's own cookie-authenticated session
 * (never the service-role client) — Row Level Security is what actually
 * stops an owner from touching another owner's rows, regardless of what
 * id a malicious client might send. An update/delete that doesn't match
 * any RLS-visible row just silently affects zero rows.
 */
async function requireClient() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase isn't configured.");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, userId: user.id };
}

async function requireOwnedBusinessId() {
  const { supabase, userId } = await requireClient();
  const { data, error } = await supabase.from("businesses").select("id").eq("owner_id", userId).limit(1).maybeSingle();
  if (error || !data) throw new Error("No business found for this account.");
  return { supabase, businessId: data.id as string };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}

// ---------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------
export async function updateLeadStatusAction(leadId: string, status: LeadStatus) {
  const { supabase } = await requireClient();
  await supabase.from("leads").update({ status }).eq("id", leadId);
}

export async function deleteLeadAction(leadId: string) {
  const { supabase } = await requireClient();
  await supabase.from("leads").delete().eq("id", leadId);
}

export async function createSampleLeadAction() {
  const { supabase, businessId } = await requireOwnedBusinessId();
  const { count } = await supabase.from("leads").select("id", { count: "exact", head: true }).eq("business_id", businessId);
  const reference = generateLeadReference((count ?? 0) + 1);

  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 7 + Math.floor(Math.random() * 20));
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2 + Math.floor(Math.random() * 5));
  const names = ["Elena Petrova", "Marko Vukovic", "James Whitfield", "Ana Kovac", "Igor Sokolov"];
  const contacts = ["+382 67 123 456", "+7 999 123 45 67", "guest@example.com", "+44 7700 900123"];
  const languages: Language[] = ["en", "me", "ru"];

  await supabase.from("leads").insert({
    business_id: businessId,
    reference,
    name: names[Math.floor(Math.random() * names.length)],
    contact: contacts[Math.floor(Math.random() * contacts.length)],
    check_in: checkIn.toISOString().slice(0, 10),
    check_out: checkOut.toISOString().slice(0, 10),
    guest_count: 1 + Math.floor(Math.random() * 4),
    language: languages[Math.floor(Math.random() * languages.length)],
    source: "website",
    status: "new",
    consent_at: new Date().toISOString(),
  });
}

/** Deletes every conversation, lead and hand-off for this owner's business. Knowledge and settings are untouched. */
export async function resetDemoDataAction() {
  const { supabase, businessId } = await requireOwnedBusinessId();
  await supabase.from("leads").delete().eq("business_id", businessId);
  await supabase.from("handoffs").delete().eq("business_id", businessId);
  await supabase.from("conversations").delete().eq("business_id", businessId); // cascades to messages
}

// ---------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------
export async function setConversationTakeoverAction(conversationId: string, takeover: boolean) {
  const { supabase } = await requireClient();
  await supabase
    .from("conversations")
    .update({ human_takeover: takeover, status: takeover ? "handed_off" satisfies ConversationStatus : "open" })
    .eq("id", conversationId);
}

export async function closeConversationAction(conversationId: string) {
  const { supabase } = await requireClient();
  await supabase.from("conversations").update({ status: "closed" satisfies ConversationStatus }).eq("id", conversationId);
}

export async function getConversationMessagesAction(conversationId: string) {
  const { supabase } = await requireClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return data ?? [];
}

// ---------------------------------------------------------------------
// Handoffs
// ---------------------------------------------------------------------
export async function updateHandoffStatusAction(handoffId: string, status: HandoffStatus) {
  const { supabase } = await requireClient();
  await supabase.from("handoffs").update({ status }).eq("id", handoffId);
}

// ---------------------------------------------------------------------
// Knowledge
// ---------------------------------------------------------------------
export interface KnowledgeItemEdit {
  question: string;
  answerEn: string;
  answerMe: string;
  answerRu: string;
}

export async function updateKnowledgeItemAction(itemId: string, edit: KnowledgeItemEdit) {
  const { supabase } = await requireClient();
  await supabase
    .from("knowledge_items")
    .update({
      question: edit.question,
      answer_en: edit.answerEn,
      answer_me: edit.answerMe || null,
      answer_ru: edit.answerRu || null,
    })
    .eq("id", itemId);
}

export async function setKnowledgeItemActiveAction(itemId: string, isActive: boolean) {
  const { supabase } = await requireClient();
  await supabase.from("knowledge_items").update({ is_active: isActive }).eq("id", itemId);
}

// ---------------------------------------------------------------------
// Business / widget settings
// ---------------------------------------------------------------------
export async function updateSupportedLanguagesAction(languages: Language[]) {
  if (languages.length === 0) throw new Error("At least one language is required.");
  const { supabase, businessId } = await requireOwnedBusinessId();
  await supabase.from("businesses").update({ supported_languages: languages }).eq("id", businessId);
}

export interface WidgetSettingsEdit {
  title: string;
  welcomeMessageEn: string;
  welcomeMessageMe: string;
  welcomeMessageRu: string;
  mockAiEnabled: boolean;
  humanHandoffEnabled: boolean;
}

export async function updateWidgetSettingsAction(edit: Partial<WidgetSettingsEdit>) {
  const { supabase, businessId } = await requireOwnedBusinessId();
  const update: Record<string, unknown> = {};
  if (edit.title !== undefined) update.title = edit.title;
  if (edit.welcomeMessageEn !== undefined) update.welcome_message_en = edit.welcomeMessageEn || null;
  if (edit.welcomeMessageMe !== undefined) update.welcome_message_me = edit.welcomeMessageMe || null;
  if (edit.welcomeMessageRu !== undefined) update.welcome_message_ru = edit.welcomeMessageRu || null;
  if (edit.mockAiEnabled !== undefined) update.mock_ai_enabled = edit.mockAiEnabled;
  if (edit.humanHandoffEnabled !== undefined) update.human_handoff_enabled = edit.humanHandoffEnabled;

  await supabase.from("widget_settings").update(update).eq("business_id", businessId);
}

// ---------------------------------------------------------------------
// Onboarding repair (owner-only, self-service fallback)
// ---------------------------------------------------------------------
export interface RepairOnboardingResult {
  ok: boolean;
  message: string;
}

/**
 * A self-service fallback for the exact bug that broke the public
 * widget: the demo business's slug wasn't the canonical
 * "adria-stay-budva" the landing page looks up (see
 * supabase/migrations/20260202000000_repair_onboarding.sql for the
 * authoritative, idempotent fix — this action exists for an owner who
 * can't run a migration, or wants to double-check their own setup).
 * Uses the owner's own session throughout: Row Level Security is what
 * makes this safe (an owner can only ever repair their own business).
 */
export async function repairOnboardingAction(): Promise<RepairOnboardingResult> {
  const { supabase, userId } = await requireClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();

  if (businessError || !business) {
    return { ok: false, message: "No business found for this account. Sign out and sign up again." };
  }

  const notes: string[] = [];

  if (business.slug !== DEMO_BUSINESS_SLUG) {
    const { error: slugError } = await supabase
      .from("businesses")
      .update({ slug: DEMO_BUSINESS_SLUG })
      .eq("id", business.id);
    if (slugError) {
      return {
        ok: false,
        message: `Could not claim the "${DEMO_BUSINESS_SLUG}" slug — it looks like another business already has it (${slugError.message}).`,
      };
    }
    notes.push(`slug fixed to "${DEMO_BUSINESS_SLUG}"`);
  }

  if (!business.is_active) {
    await supabase.from("businesses").update({ is_active: true }).eq("id", business.id);
    notes.push("business re-activated");
  }

  const { data: widgetSettings } = await supabase
    .from("widget_settings")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();

  if (!widgetSettings) {
    await supabase.from("widget_settings").insert({
      business_id: business.id,
      title: "Adria Assistant",
      welcome_message_en: GREETING.en,
      welcome_message_me: GREETING.me,
      welcome_message_ru: GREETING.ru,
    });
    notes.push("widget settings created");
  } else if (!widgetSettings.mock_ai_enabled) {
    await supabase.from("widget_settings").update({ mock_ai_enabled: true }).eq("id", widgetSettings.id);
    notes.push("mock AI re-enabled");
  }

  const { count: knowledgeCount } = await supabase
    .from("knowledge_items")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  if (!knowledgeCount) {
    const categories = Object.keys(FAQ_ANSWERS) as (keyof typeof FAQ_ANSWERS)[];
    await supabase.from("knowledge_items").insert(
      categories.map((category, index) => ({
        business_id: business.id,
        category,
        question: FAQ_QUESTIONS[category as keyof typeof FAQ_QUESTIONS] ?? category,
        answer_en: FAQ_ANSWERS[category]!.en,
        answer_me: FAQ_ANSWERS[category]!.me,
        answer_ru: FAQ_ANSWERS[category]!.ru,
        sort_order: index,
      })),
    );
    notes.push("knowledge seeded");
  }

  if (notes.length === 0) {
    return { ok: true, message: "Everything already looks correct — no changes were needed." };
  }
  return { ok: true, message: `Fixed: ${notes.join(", ")}.` };
}
