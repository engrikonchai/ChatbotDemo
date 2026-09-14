import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { widgetMessageRequestSchema, firstIssueMessage } from "@/lib/validation/widget";
import { checkRateLimit, getRequestIp } from "@/lib/server/rate-limit";
import { apiError, ASSISTANT_UNAVAILABLE_MESSAGE, logServerError, rateLimited } from "@/lib/server/api-response";
import {
  countLeadsForBusiness,
  generateLeadReference,
  insertMessages,
  loadOwnedConversation,
  persistLeadDraft,
  resolveActiveBusiness,
  updateConversationFlowState,
  updateMessageContent,
} from "@/lib/server/widget-service";
import { getChatService } from "@/lib/server/chat-provider";
import type { ConversationState } from "@/lib/chat/types";

const LEAD_SAVE_FAILED_NOTICE =
  "Thanks — but I couldn't save your enquiry just now. Please try again in a moment, or contact the host directly.";

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

  let chatService;
  try {
    chatService = getChatService();
  } catch (error) {
    logServerError("widget/message:provider", error);
    return apiError(500, ASSISTANT_UNAVAILABLE_MESSAGE);
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    logServerError("widget/message", "Supabase admin client unavailable (missing env vars)", { publicWidgetId });
    return apiError(503, ASSISTANT_UNAVAILABLE_MESSAGE);
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
    logServerError("widget/message", "Failed to persist visitor message", { conversationId });
    return apiError(500, ASSISTANT_UNAVAILABLE_MESSAGE);
  }

  const state = (
    conversation.flow_state && Object.keys(conversation.flow_state).length > 0
      ? conversation.flow_state
      : chatService.createInitialState(conversation.detected_language as ConversationState["language"])
  ) as ConversationState;

  const nextLeadSequence = (await countLeadsForBusiness(admin, business.id)) + 1;

  const result = await chatService.sendMessage({
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
    logServerError("widget/message", "Failed to persist assistant reply", { conversationId });
    return apiError(500, ASSISTANT_UNAVAILABLE_MESSAGE);
  }

  await updateConversationFlowState(admin, conversation.id, {
    flowState: result.state,
    leadCreated: Boolean(result.leadDraft),
  });

  // Whether the booking/hand-off record actually got saved — the
  // response (and, if not, the just-saved success message) must reflect
  // reality, not what the mock engine merely *intended* to happen.
  let leadCreated = false;
  let leadReference: string | null = null;
  const responseMessages = savedAssistantMessages.map((m) => ({
    id: m.id,
    role: m.role,
    text: m.content,
    intent: m.intent,
    createdAt: m.created_at,
  }));

  if (result.leadDraft) {
    const reference = result.leadReference ?? generateLeadReference(nextLeadSequence);
    const { error } = await persistLeadDraft(admin, {
      businessId: business.id,
      conversationId: conversation.id,
      reference,
      draft: result.leadDraft,
    });

    if (error) {
      logServerError("widget/message:persistLeadDraft", error, { conversationId, businessId: business.id });
      // The assistant's reply text (already saved above) announced a
      // reference number that doesn't actually exist in `leads` — correct
      // the stored message and what's returned to the visitor rather than
      // reporting success for a database write that failed.
      const lastMessage = responseMessages[responseMessages.length - 1];
      if (lastMessage) {
        await updateMessageContent(admin, lastMessage.id, LEAD_SAVE_FAILED_NOTICE);
        lastMessage.text = LEAD_SAVE_FAILED_NOTICE;
      }
    } else {
      leadCreated = true;
      leadReference = reference;
    }
  }

  return NextResponse.json({
    messages: responseMessages,
    language: result.state.language,
    flowActive: result.state.flow !== null,
    suggestedReplies: result.suggestedReplies ?? [],
    leadCreated,
    leadReference,
  });
}
