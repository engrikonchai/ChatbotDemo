import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { widgetLeadRequestSchema, firstIssueMessage } from "@/lib/validation/widget";
import { checkRateLimit, getRequestIp } from "@/lib/server/rate-limit";
import { apiError, ASSISTANT_UNAVAILABLE_MESSAGE, logServerError, rateLimited } from "@/lib/server/api-response";
import {
  countLeadsForBusiness,
  createLeadRow,
  generateLeadReference,
  loadOwnedConversation,
  resolveActiveBusiness,
} from "@/lib/server/widget-service";

/**
 * Standalone, independently secured lead-creation endpoint. The chat
 * widget's guided booking flow creates leads itself (as part of
 * `/api/widget/message`, once the flow completes) rather than calling
 * this route — this endpoint exists so lead creation has its own
 * hardened, directly testable entry point, per the Phase 2 brief, and
 * so a future non-chat lead form could call it directly.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Invalid JSON body.");
  }

  const parsed = widgetLeadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, firstIssueMessage(parsed.error));
  }
  const { publicWidgetId, visitorId, conversationId, name, contact, checkIn, checkOut, guests, note, language, reference } =
    parsed.data;

  const rate = checkRateLimit(`lead:${publicWidgetId}:${visitorId}:${getRequestIp(request)}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) return rateLimited(rate.retryAfterMs);

  const admin = createSupabaseAdminClient();
  if (!admin) {
    logServerError("widget/lead", "Supabase admin client unavailable (missing env vars)", { publicWidgetId });
    return apiError(503, ASSISTANT_UNAVAILABLE_MESSAGE);
  }

  const business = await resolveActiveBusiness(admin, publicWidgetId);
  if (!business) return apiError(404, "Widget not found.");

  let ownedConversationId: string | null = null;
  if (conversationId) {
    const conversation = await loadOwnedConversation(admin, { conversationId, businessId: business.id, visitorId });
    if (conversation) ownedConversationId = conversation.id;
  }

  const finalReference = reference ?? generateLeadReference((await countLeadsForBusiness(admin, business.id)) + 1);

  const { data, error } = await createLeadRow(admin, {
    businessId: business.id,
    conversationId: ownedConversationId,
    reference: finalReference,
    name,
    contact,
    checkIn,
    checkOut,
    guests,
    note,
    language,
    consentAt: new Date().toISOString(),
  });

  if (error || !data) {
    logServerError("widget/lead", error, { businessId: business.id });
    return apiError(500, ASSISTANT_UNAVAILABLE_MESSAGE);
  }

  return NextResponse.json({ reference: data.reference }, { status: 201 });
}
