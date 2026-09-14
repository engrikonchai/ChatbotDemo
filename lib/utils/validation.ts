import { isCheckOutAfterCheckIn, isPastDate } from "@/lib/utils/date";

export interface ValidationResult {
  valid: boolean;
  reason?: "empty" | "past_date" | "invalid_range" | "out_of_bounds" | "not_a_number";
}

const ok: ValidationResult = { valid: true };

export const MIN_GUESTS = 1;
export const MAX_GUESTS = 4;

/** A check-in date must exist and must not be in the past. */
export function validateCheckInDate(isoDate: string | undefined): ValidationResult {
  if (!isoDate) return { valid: false, reason: "empty" };
  if (isPastDate(isoDate)) return { valid: false, reason: "past_date" };
  return ok;
}

/** A check-out date must exist, not be in the past, and be after check-in. */
export function validateCheckOutDate(
  isoDate: string | undefined,
  checkInIso: string | undefined,
): ValidationResult {
  if (!isoDate) return { valid: false, reason: "empty" };
  if (isPastDate(isoDate)) return { valid: false, reason: "past_date" };
  if (!checkInIso || !isCheckOutAfterCheckIn(checkInIso, isoDate)) {
    return { valid: false, reason: "invalid_range" };
  }
  return ok;
}

/** Guests must be a whole number between MIN_GUESTS and MAX_GUESTS inclusive. */
export function validateGuestCount(raw: string | number | undefined): ValidationResult {
  if (raw === undefined || raw === "") return { valid: false, reason: "empty" };
  const value = typeof raw === "number" ? raw : Number(raw.toString().trim());
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return { valid: false, reason: "not_a_number" };
  }
  if (value < MIN_GUESTS || value > MAX_GUESTS) {
    return { valid: false, reason: "out_of_bounds" };
  }
  return ok;
}

/** Name must contain at least one non-whitespace character. */
export function validateName(name: string | undefined): ValidationResult {
  if (!name || !name.trim()) return { valid: false, reason: "empty" };
  return ok;
}

/** Contact (phone, WhatsApp or email) must contain at least one non-whitespace character. */
export function validateContact(contact: string | undefined): ValidationResult {
  if (!contact || !contact.trim()) return { valid: false, reason: "empty" };
  return ok;
}
