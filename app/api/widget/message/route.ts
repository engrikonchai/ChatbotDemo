import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { widgetMessageRequestSchema, firstIssueMessage } from "@/lib/validation/widget";
import { checkRateLimit, getRequestIp } from "@/lib/server/rate-limit";
import { apiError, logServerError, rateLimited } from "@/lib/server/api-response";
import {
  countLeadsForBusiness,
  generateLeadReference,
  insertMessages,
  loadOwnedConversation,
  persistLeadDraft,
  resolveActiveBusiness,
  updateConversationFlowState,
} from "@/lib/server/widget-service";
import { mockChatService } from "@/lib/chat/mock-chat-service";
import type { ConversationState } from "@/lib/chat/types";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Invalid JSON body.");
  }

  const parsed = widgetMessageRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, firstIssueMessage(parsed.error));
  }
  const { publicWidgetId, visitorId, conversationId, message } = parsed.data;

  const rate = checkRateLimit(`message:${publicWidgetId}:${visitorId}:${getRequestIp(request)}`, {
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!rate.allowed) return rateLimited(rate.retryAfterMs);

  const admin = createSupabaseAdminClient();
  if (!admin) {
    logServerError("widget/message", "Supabase admin client unavailable (missing env vars)");
    return apiError(503, "Chat is temporarily unavailable. Please try again shortly.");
  }

  const business = await resolveActiveBusiness(admin, publicWidgetId);
  if (!business) return apiError(404, "Widget not found.");

  const conversation = await loadOwnedConversation(admin, { conversationId, businessId: business.id, visitorId });
  if (!conversation) return apiError(404, "Conversation not found.");
  if (conversation.status === "closed") {
    return apiError(409, "This conversation has been closed.");
  }

  // Save the visitor's message first, so it's recorded even if something
  // downstream fails. If this write fails, stop rather than silently
  // generating a reply to a message that was never persisted.
  const savedUserMessage = await insertMessages(admin, conversation.id, [{ role: "user", content: message }]);
  if (savedUserMessage.length === 0) {
    logServerError("widget/message", "Failed to persist visitor message");
    return apiError(500, "Could not save your message. Please try again.");
  }

  const state = (
    conversation.flow_state && Object.keys(conversation.flow_state).length > 0
      ? conversation.flow_state
      : mockChatService.createInitialState(conversation.detected_language as ConversationState["language"])
  ) as ConversationState;

  const nextLeadSequence = (await countLeadsForBusiness(admin, business.id)) + 1;

  const result = await mockChatService.sendMessage({
    message,
    state,
    history: [],
    nextLeadSequence,
  });

  const savedAssistantMessages = await insertMessages(
    admin,
    conversation.id,
    result.messages.map((m) => ({ role: m.role, content: m.text, intent: m.intent })),
  );
  if (savedAssistantMessages.length !== result.messages.length) {
    logServerError("widget/message", "Failed to persist assistant reply");
    return apiError(500, "Could not save the assistant's reply. Please try again.");
  }

  await updateConversationFlowState(admin, conversation.id, {
    flowState: result.state,
    leadCreated: Boolean(result.leadDraft),
  });

  if (result.leadDraft) {
    const reference = result.leadReference ?? generateLeadReference(nextLeadSequence);
    const { error } = await persistLeadDraft(admin, {
      businessId: business.id,
      conversationId: conversation.id,
      reference,
      draft: result.leadDraft,
    });
    if (error) {
      logServerError("widget/message:persistLeadDraft", error);
    }
  }

  return NextResponse.json({
    messages: savedAssistantMessages.map((m) => ({
      id: m.id,
      role: m.role,
      text: m.content,
      intent: m.intent,
      createdAt: m.created_at,
    })),
    language: result.state.language,
    flowActive: result.state.flow !== null,
    suggestedReplies: result.suggestedReplies ?? [],
    leadCreated: Boolean(result.leadDraft),
    leadReference: result.leadReference ?? null,
  });
}
