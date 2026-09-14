import { z } from "zod";

/**
 * Zod schemas for every request the public chat widget can make
 * (`app/api/widget/*`). These are the authoritative validation layer —
 * the client-side checks in `lib/utils/validation.ts` exist only for
 * responsive UI, never for security. Nothing here trusts the caller for
 * anything beyond "this looks like well-formed input"; business/tenant
 * authorization happens separately in `lib/server/widget-service.ts`.
 */

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_NAME_LENGTH = 200;
export const MAX_CONTACT_LENGTH = 200;
export const MAX_NOTE_LENGTH = 1000;
export const MAX_QUESTION_LENGTH = 2000;
export const MIN_VISITOR_ID_LENGTH = 8;
export const MAX_VISITOR_ID_LENGTH = 200;
export const MIN_GUESTS = 1;
export const MAX_GUESTS = 4;

const publicWidgetIdSchema = z.uuid({ message: "Invalid widget id." });
const conversationIdSchema = z.uuid({ message: "Invalid conversation id." });
const visitorIdSchema = z
  .string()
  .trim()
  .min(MIN_VISITOR_ID_LENGTH, { message: "Invalid visitor id." })
  .max(MAX_VISITOR_ID_LENGTH, { message: "Invalid visitor id." });
const languageSchema = z.enum(["en", "me", "ru"]);
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Expected an ISO date (YYYY-MM-DD)." });

export const widgetSessionRequestSchema = z.object({
  publicWidgetId: publicWidgetIdSchema,
  visitorId: visitorIdSchema,
  language: languageSchema.optional(),
  /** A previously-stored conversation id (see lib/client/visitor.ts) to resume, if still valid. */
  conversationId: conversationIdSchema.optional(),
});
export type WidgetSessionRequest = z.infer<typeof widgetSessionRequestSchema>;

export const widgetMessageRequestSchema = z.object({
  publicWidgetId: publicWidgetIdSchema,
  visitorId: visitorIdSchema,
  conversationId: conversationIdSchema,
  message: z
    .string()
    .trim()
    .min(1, { message: "Message cannot be empty." })
    .max(MAX_MESSAGE_LENGTH, { message: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` }),
});
export type WidgetMessageRequest = z.infer<typeof widgetMessageRequestSchema>;

export const widgetLeadRequestSchema = z
  .object({
    publicWidgetId: publicWidgetIdSchema,
    visitorId: visitorIdSchema,
    conversationId: conversationIdSchema.optional(),
    name: z.string().trim().min(1, { message: "Name is required." }).max(MAX_NAME_LENGTH),
    contact: z.string().trim().min(1, { message: "Contact is required." }).max(MAX_CONTACT_LENGTH),
    checkIn: isoDateSchema.optional(),
    checkOut: isoDateSchema.optional(),
    guests: z
      .number()
      .int()
      .min(MIN_GUESTS, { message: `Guests must be at least ${MIN_GUESTS}.` })
      .max(MAX_GUESTS, { message: `Guests must be at most ${MAX_GUESTS}.` })
      .optional(),
    note: z.string().trim().max(MAX_NOTE_LENGTH).optional(),
    language: languageSchema.default("en"),
    reference: z
      .string()
      .regex(/^ASB-\d{4}-\d{4}$/, { message: "Invalid reference." })
      .optional(),
    consent: z.literal(true, { message: "Consent is required before submitting an enquiry." }),
  })
  .superRefine((data, ctx) => {
    if (data.checkIn && data.checkOut && !(data.checkOut > data.checkIn)) {
      ctx.addIssue({ code: "custom", path: ["checkOut"], message: "Check-out must be after check-in." });
    }
  });
export type WidgetLeadRequest = z.infer<typeof widgetLeadRequestSchema>;

export const widgetHandoffRequestSchema = z.object({
  publicWidgetId: publicWidgetIdSchema,
  visitorId: visitorIdSchema,
  conversationId: conversationIdSchema.optional(),
  customerName: z.string().trim().max(MAX_NAME_LENGTH).optional(),
  contact: z.string().trim().min(1, { message: "Contact is required." }).max(MAX_CONTACT_LENGTH),
  question: z.string().trim().max(MAX_QUESTION_LENGTH).optional(),
  reason: z.string().trim().max(MAX_QUESTION_LENGTH).optional(),
  language: languageSchema.default("en"),
});
export type WidgetHandoffRequest = z.infer<typeof widgetHandoffRequestSchema>;

/** Formats the first Zod issue into a short, safe-to-return message. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid request.";
}
