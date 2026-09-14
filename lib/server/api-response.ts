import "server-only";
import { NextResponse } from "next/server";
import { ASSISTANT_UNAVAILABLE_MESSAGE } from "@/lib/shared/messages";

// Re-exported so route handlers only need one import for both this and
// apiError/logServerError/rateLimited below.
export { ASSISTANT_UNAVAILABLE_MESSAGE };

/** A small, consistent JSON error shape. Never includes internals/stack traces. */
export function apiError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function rateLimited(retryAfterMs: number) {
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
  );
}

// Fields that must never reach the server log, however they got into a
// `meta` object — checked case-insensitively against the key name.
const SENSITIVE_META_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "token",
  "access_token",
  "refresh_token",
  "password",
  "service_role_key",
  "supabase_service_role_key",
  "contact",
  "name",
  "note",
  "question",
  "message",
]);

function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    safe[key] = SENSITIVE_META_KEYS.has(key.toLowerCase()) ? "[redacted]" : value;
  }
  return safe;
}

/**
 * Structured, server-only diagnostic logging for a failed widget
 * request. `meta` should be small, non-sensitive identifiers (a route
 * name, a widget/conversation id, an HTTP status) — never request
 * headers, tokens, or visitor-supplied free text (name/contact/note/
 * question/message are redacted automatically even if passed by
 * mistake, per the fields above).
 */
export function logServerError(context: string, error: unknown, meta: Record<string, unknown> = {}): void {
  const reason = error instanceof Error ? error.message : typeof error === "string" ? error : "unknown error";
  console.error(
    JSON.stringify({
      level: "error",
      context,
      reason,
      ...sanitizeMeta(meta),
      timestamp: new Date().toISOString(),
    }),
  );
}
