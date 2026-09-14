"use client";

import { isBrowser } from "@/lib/storage/storage";

/**
 * LocalStorage is no longer the source of truth for conversations, leads
 * or handoffs — Supabase is (see lib/server/widget-service.ts and the
 * /api/widget/* routes). The only things it's still allowed to hold, per
 * the Phase 2 brief, are the visitor's own local identity: their
 * (anonymous) visitor id, and the id of their current conversation so a
 * page reload can resume it instead of starting over.
 */

const NAMESPACE = "adria-stay-budva";
const VERSION = "v2";
const VISITOR_ID_KEY = `${NAMESPACE}:${VERSION}:visitor-id`;
const CONVERSATION_ID_KEY = `${NAMESPACE}:${VERSION}:conversation-id`;

function generateVisitorId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Returns the visitor's local id, creating and persisting one on first use. */
export function getOrCreateVisitorId(): string {
  if (!isBrowser()) return "";
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const id = generateVisitorId();
    window.localStorage.setItem(VISITOR_ID_KEY, id);
    return id;
  } catch {
    // Private browsing / storage disabled — fall back to a session-only id.
    return generateVisitorId();
  }
}

export function getStoredConversationId(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(CONVERSATION_ID_KEY);
  } catch {
    return null;
  }
}

export function setStoredConversationId(conversationId: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CONVERSATION_ID_KEY, conversationId);
  } catch {
    // Ignore — worst case, the next reload just starts a fresh conversation.
  }
}

/** Development-only affordance: forgets who this browser is, and its current conversation. */
export function clearLocalVisitorSession(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(VISITOR_ID_KEY);
    window.localStorage.removeItem(CONVERSATION_ID_KEY);
  } catch {
    // Nothing sensible to do if this fails.
  }
}
