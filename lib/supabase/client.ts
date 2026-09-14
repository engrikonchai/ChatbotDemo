"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

let cached: SupabaseClient | null = null;

/**
 * Browser Supabase client for client components (auth forms, sign-out).
 * Only ever uses the two `NEXT_PUBLIC_*` variables. Returns `null` when
 * Supabase isn't configured so callers can show a helpful message
 * instead of crashing.
 */
export function createSupabaseBrowserClient(): SupabaseClient | null {
  const env = getPublicSupabaseEnv();
  if (!env) return null;
  if (!cached) {
    cached = createBrowserClient(env.url, env.anonKey);
  }
  return cached;
}
