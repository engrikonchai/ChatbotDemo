import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { widgetSessionRequestSchema, firstIssueMessage } from "@/lib/validation/widget";
import { checkRateLimit, getRequestIp } from "@/lib/server/rate-limit";
import { apiError, logServerError, rateLimited } from "@/lib/server/api-response";
import {
  createConversationRow,
  getWidgetSettings,
  insertMessages,
  listMessages,
  loadOwnedConversation,
  resolveActiveBusiness,
  resolveSessionLanguage,
} from "@/lib/server/widget-service";
import { mockChatService } from "@/lib/chat/mock-chat-service";
import { GREETING } from "@/lib/chat/translations";
import type { ConversationState, Language } from "@/lib/chat/types";
import type { WidgetSettingsRow } from "@/lib/supabase/database.types";

function welcomeMessageFor(settings: WidgetSettingsRow | null, language: Language): string | null {
  if (!settings) return null;
  if (language === "me") return settings.welcome_message_me;
  if (language === "ru") return settings.welcome_message_ru;
  return settings.welcome_message_en;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Invalid JSON body.");
  }

  const parsed = widgetSessionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, firstIssueMessage(parsed.error));
  }
  const { publicWidgetId, visitorId, language: requestedLanguage, conversationId: existingConversationId } = parsed.data;

  const rate = checkRateLimit(`session:${publicWidgetId}:${visitorId}:${getRequestIp(request)}`, {
    limit: 30,
    windowMs: 5 * 60 * 1000,
  });
  if (!rate.allowed) return rateLimited(rate.retryAfterMs);

  const admin = createSupabaseAdminClient();
  if (!admin) {
    logServerError("widget/session", "Supabase admin client unavailable (missing env vars)");
    return apiError(503, "Chat is temporarily unavailable. Please try again shortly.");
  }

  const business = await resolveActiveBusiness(admin, publicWidgetId);
  if (!business) {
    return apiError(404, "Widget not found.");
  }

  const widgetSettings = await getWidgetSettings(admin, business.id);
  if (widgetSettings && !widgetSettings.mock_ai_enabled) {
    return NextResponse.json({ enabled: false });
  }

  const widgetInfo = {
    title: widgetSettings?.title ?? "Adria Assistant",
    humanHandoffEnabled: widgetSettings?.human_handoff_enabled ?? true,
  };

  // Try to resume a previously-stored conversation (see lib/client/visitor.ts).
  if (existingConversationId) {
    const existing = await loadOwnedConversation(admin, {
      conversationId: existingConversationId,
      businessId: business.id,
      visitorId,
    });
    if (existing && existing.status === "open") {
      const rows = await listMessages(admin, existing.id);
      const flowState = existing.flow_state as unknown as ConversationState;
      return NextResponse.json({
        enabled: true,
        resumed: true,
        conversationId: existing.id,
        language: existing.detected_language,
        flowActive: Boolean(flowState?.flow),
        messages: rows.map((m) => ({ id: m.id, role: m.role, text: m.content, intent: m.intent, createdAt: m.created_at })),
        widget: widgetInfo,
      });
    }
  }

  const language: Language = resolveSessionLanguage(business, requestedLanguage);
  const initialState = mockChatService.createInitialState(language);

  const conversation = await createConversationRow(admin, {
    businessId: business.id,
    visitorId,
    language,
    state: initialState,
  });
  if (!conversation) {
    logServerError("widget/session", "Failed to create conversation row");
    return apiError(500, "Could not start a new conversation. Please try again.");
  }

  // Owner-editable welcome message, falling back to the built-in default.
  const greetingText = welcomeMessageFor(widgetSettings, language) || GREETING[language];
  const [savedGreeting] = await insertMessages(admin, conversation.id, [
    { role: "assistant", content: greetingText, intent: "greeting" },
  ]);

  return NextResponse.json({
    enabled: true,
    resumed: false,
    conversationId: conversation.id,
    language,
    flowActive: false,
    messages: [
      {
        id: savedGreeting?.id ?? `greeting_${conversation.id}`,
        role: "assistant",
        text: greetingText,
        intent: "greeting",
        createdAt: savedGreeting?.created_at ?? new Date().toISOString(),
      },
    ],
    widget: widgetInfo,
  });
}
