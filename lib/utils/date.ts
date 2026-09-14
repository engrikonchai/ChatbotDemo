/** Date parsing/formatting helpers for the booking-enquiry flow. */

/** Returns today's date at local midnight, for past-date comparisons. */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Formats a Date as an ISO calendar date (YYYY-MM-DD), in local time. */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses everyday date text into an ISO date string, or null if the
 * text isn't recognisable. Deliberately supports only a handful of
 * unambiguous, commonly-typed formats:
 *  - 2026-06-10 (ISO)
 *  - 10.06.2026 / 10/06/2026 (day.month.year, day/month/year)
 *  - 10.06 / 10/06 (day.month, year assumed to be this year or next)
 */
export function parseFlexibleDate(input: string, reference: Date = startOfToday()): string | null {
  const text = input.trim();
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return validateAndFormat(Number(y), Number(m), Number(d));
  }

  const dottedOrSlashed = text.match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?$/);
  if (dottedOrSlashed) {
    const [, dStr, mStr, yStr] = dottedOrSlashed;
    const day = Number(dStr);
    const month = Number(mStr);
    let year: number;
    if (yStr) {
      year = yStr.length === 2 ? 2000 + Number(yStr) : Number(yStr);
    } else {
      // No year given: assume this year, or next year if that date already passed.
      year = reference.getFullYear();
      const candidate = validateAndFormat(year, month, day);
      if (candidate && new Date(candidate) < reference) {
        year += 1;
      }
    }
    return validateAndFormat(year, month, day);
  }

  return null;
}

function validateAndFormat(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  // Guard against overflow, e.g. 31 February rolling into March.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return toISODate(date);
}

/** True when `isoDate` is strictly before today (local time). */
export function isPastDate(isoDate: string, reference: Date = startOfToday()): boolean {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return true;
  return date.getTime() < reference.getTime();
}

/** True when `checkOutIso` is strictly after `checkInIso`. */
export function isCheckOutAfterCheckIn(checkInIso: string, checkOutIso: string): boolean {
  const checkIn = new Date(`${checkInIso}T00:00:00`);
  const checkOut = new Date(`${checkOutIso}T00:00:00`);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return false;
  return checkOut.getTime() > checkIn.getTime();
}

/** Formats an ISO date for display, e.g. "10 Jun 2026". */
export function formatDisplayDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
