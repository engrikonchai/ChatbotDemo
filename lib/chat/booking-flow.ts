import type { BookingDraft, BookingStep, Language } from "@/lib/chat/types";
import { BOOKING_FLOW_TEXT, NO_WORDS, SKIP_WORDS, YES_WORDS } from "@/lib/chat/translations";
import { containsAnyKeyword } from "@/lib/chat/language-detection";
import { parseFlexibleDate, formatDisplayDate } from "@/lib/utils/date";
import {
  validateCheckInDate,
  validateCheckOutDate,
  validateContact,
  validateGuestCount,
  validateName,
} from "@/lib/utils/validation";

export interface BookingStepOutcome {
  reply: string;
  nextStep: BookingStep;
  draft: BookingDraft;
  suggestedReplies?: string[];
  /** True once the visitor has confirmed — caller should create the lead. */
  submitted?: boolean;
}

function isYes(text: string, language: Language): boolean {
  return containsAnyKeyword(text, YES_WORDS[language]);
}

function isNo(text: string, language: Language): boolean {
  return containsAnyKeyword(text, NO_WORDS[language]);
}

function isSkip(text: string, language: Language): boolean {
  return containsAnyKeyword(text, SKIP_WORDS[language]);
}

export function buildBookingSummary(draft: BookingDraft, language: Language): string {
  const t = BOOKING_FLOW_TEXT[language];
  const lines = [
    t.summaryHeading,
    `${t.summaryCheckIn}: ${draft.checkIn ? formatDisplayDate(draft.checkIn) : "—"}`,
    `${t.summaryCheckOut}: ${draft.checkOut ? formatDisplayDate(draft.checkOut) : "—"}`,
    `${t.summaryGuests}: ${draft.guests ?? "—"}`,
    `${t.summaryName}: ${draft.name ?? "—"}`,
    `${t.summaryContact}: ${draft.contact ?? "—"}`,
  ];
  if (draft.note) {
    lines.push(`${t.summaryNote}: ${draft.note}`);
  }
  lines.push("", t.consentNotice, t.enquiryDisclaimer, t.confirmQuestion);
  return lines.join("\n");
}

/**
 * Advances the booking-enquiry flow by exactly one step. Pure and
 * side-effect free: the caller is responsible for creating the lead
 * once `submitted` comes back true.
 */
export function processBookingStep(
  step: BookingStep,
  draft: BookingDraft,
  message: string,
  language: Language,
): BookingStepOutcome {
  const t = BOOKING_FLOW_TEXT[language];

  switch (step) {
    case "checkin": {
      const parsed = parseFlexibleDate(message);
      const validation = validateCheckInDate(parsed ?? undefined);
      if (!parsed) {
        return { reply: t.errorDateFormat, nextStep: "checkin", draft };
      }
      if (!validation.valid) {
        return { reply: t.errorDatePast, nextStep: "checkin", draft };
      }
      return {
        reply: t.askCheckOut,
        nextStep: "checkout",
        draft: { ...draft, checkIn: parsed },
      };
    }

    case "checkout": {
      const parsed = parseFlexibleDate(message);
      if (!parsed) {
        return { reply: t.errorDateFormat, nextStep: "checkout", draft };
      }
      const validation = validateCheckOutDate(parsed, draft.checkIn);
      if (!validation.valid) {
        const reply = validation.reason === "past_date" ? t.errorDatePast : t.errorCheckoutRange;
        return { reply, nextStep: "checkout", draft };
      }
      return {
        reply: t.askGuests,
        nextStep: "guests",
        draft: { ...draft, checkOut: parsed },
      };
    }

    case "guests": {
      const validation = validateGuestCount(message.trim());
      if (!validation.valid) {
        return { reply: t.errorGuests, nextStep: "guests", draft };
      }
      return {
        reply: t.askName,
        nextStep: "name",
        draft: { ...draft, guests: Number(message.trim()) },
      };
    }

    case "name": {
      const validation = validateName(message);
      if (!validation.valid) {
        return { reply: t.errorName, nextStep: "name", draft };
      }
      return {
        reply: t.askContact,
        nextStep: "contact",
        draft: { ...draft, name: message.trim() },
      };
    }

    case "contact": {
      const validation = validateContact(message);
      if (!validation.valid) {
        return { reply: t.errorContact, nextStep: "contact", draft };
      }
      return {
        reply: t.askNote,
        nextStep: "note",
        draft: { ...draft, contact: message.trim() },
      };
    }

    case "note": {
      const nextDraft = isSkip(message, language) ? draft : { ...draft, note: message.trim() };
      return {
        reply: buildBookingSummary(nextDraft, language),
        nextStep: "confirm",
        draft: nextDraft,
        suggestedReplies: [t.confirmQuestion],
      };
    }

    case "confirm": {
      if (isYes(message, language)) {
        return { reply: "", nextStep: "done", draft, submitted: true };
      }
      if (isNo(message, language)) {
        return { reply: t.cancelled, nextStep: "done", draft };
      }
      return {
        reply: buildBookingSummary(draft, language),
        nextStep: "confirm",
        draft,
      };
    }

    case "done":
    default:
      return { reply: "", nextStep: "done", draft };
  }
}
