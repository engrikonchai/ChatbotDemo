import "server-only";
import { NextResponse } from "next/server";

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

/** Logged server-side only — never sent to the client. */
export function logServerError(context: string, error: unknown): void {
  console.error(`[api:${context}]`, error);
}
