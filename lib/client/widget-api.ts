"use client";

import type { Language } from "@/lib/chat/types";
import { getPublicWidgetId } from "@/lib/supabase/env";

export interface WidgetApiMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  intent?: string | null;
  createdAt: string;
}

export type WidgetApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

async function postJson<T>(path: string, body: unknown): Promise<WidgetApiResult<T>> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      return { ok: false, status: response.status, error: typeof data.error === "string" ? data.error : "Something went wrong." };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, status: 0, error: "Could not reach the server. Please check your connection." };
  }
}

export interface SessionResponse {
  enabled: boolean;
  resumed?: boolean;
  conversationId?: string;
  language?: Language;
  flowActive?: boolean;
  messages?: WidgetApiMessage[];
  widget?: { title: string; humanHandoffEnabled: boolean };
}

export function startWidgetSession(params: {
  visitorId: string;
  language?: Language;
  conversationId?: string;
}): Promise<WidgetApiResult<SessionResponse>> {
  return postJson("/api/widget/session", { publicWidgetId: getPublicWidgetId(), ...params });
}

export interface MessageResponse {
  messages: WidgetApiMessage[];
  language: Language;
  flowActive: boolean;
  suggestedReplies: string[];
  leadCreated: boolean;
  leadReference: string | null;
}

export function sendWidgetMessage(params: {
  visitorId: string;
  conversationId: string;
  message: string;
}): Promise<WidgetApiResult<MessageResponse>> {
  return postJson("/api/widget/message", { publicWidgetId: getPublicWidgetId(), ...params });
}
