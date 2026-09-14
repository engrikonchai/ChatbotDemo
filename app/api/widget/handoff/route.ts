import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { widgetHandoffRequestSchema, firstIssueMessage } from "@/lib/validation/widget";
import { checkRateLimit, getRequestIp } from "@/lib/server/rate-limit";
import { apiError, logServerError, rateLimited } from "@/lib/server/api-response";
import { createHandoffRow, loadOwnedConversation, resolveActiveBusiness } from "@/lib/server/widget-service";

/**
 * Standalone, independently secured hand-off endpoint — see the note in
 * `app/api/widget/lead/route.ts`. The chat widget's guided hand-off flow
 * creates its record itself as part of `/api/widget/message`.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Invalid JSON body.");
  }

  const parsed = widgetHandoffRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, firstIssueMessage(parsed.error));
  }
  const { publicWidgetId, visitorId, conversationId, customerName, contact, question, reason } = parsed.data;

  const rate = checkRateLimit(`handoff:${publicWidgetId}:${visitorId}:${getRequestIp(request)}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) return rateLimited(rate.retryAfterMs);

  const admin = createSupabaseAdminClient();
  if (!admin) {
    logServerError("widget/handoff", "Supabase admin client unavailable (missing env vars)");
    return apiError(503, "This isn't available right now. Please try again shortly.");
  }

  const business = await resolveActiveBusiness(admin, publicWidgetId);
  if (!business) return apiError(404, "Widget not found.");

  let ownedConversationId: string | null = null;
  if (conversationId) {
    const conversation = await loadOwnedConversation(admin, { conversationId, businessId: business.id, visitorId });
    if (conversation) ownedConversationId = conversation.id;
  }

  const { data, error } = await createHandoffRow(admin, {
    businessId: business.id,
    conversationId: ownedConversationId,
    customerName,
    contact,
    question,
    reason,
  });

  if (error || !data) {
    logServerError("widget/handoff", error);
    return apiError(500, "Could not save your request. Please try again.");
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
