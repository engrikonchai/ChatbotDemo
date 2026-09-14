/**
 * Copy shared between server (API routes) and client (ChatWidget) code.
 * Deliberately has no `server-only` guard and no side effects, so both
 * sides can import the exact same string instead of two copies that
 * could quietly drift apart.
 */

/** Shown to a real visitor whenever the assistant can't respond, for any reason. */
export const ASSISTANT_UNAVAILABLE_MESSAGE =
  "Sorry, the assistant is temporarily unavailable. Please try again or contact the host directly.";
