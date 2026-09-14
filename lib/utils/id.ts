/** Small, dependency-free id helpers. Kept pure so they stay easy to test. */

/**
 * Generates a random-enough id for client-only demo data (messages,
 * conversations). Not cryptographically secure — this is a demo.
 */
export function generateId(prefix = "id"): string {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${random}`;
}

/**
 * Builds a readable enquiry reference such as `ASB-2026-0007`.
 * `sequence` is 1-based and should come from the caller (typically
 * `getLeads().length + 1`) so the mock chat service can generate the
 * reference itself without touching storage directly.
 */
export function generateLeadReference(sequence: number, date: Date = new Date()): string {
  const year = date.getFullYear();
  const safeSequence = Number.isFinite(sequence) && sequence > 0 ? Math.floor(sequence) : 1;
  const padded = String(safeSequence).padStart(4, "0");
  return `ASB-${year}-${padded}`;
}
