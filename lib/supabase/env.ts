/**
 * Central place that reads Supabase environment variables. Never throws
 * at module load time (that would break the build and the public
 * landing page when Supabase isn't configured yet) — callers decide how
 * to react to a missing configuration.
 */

export interface PublicSupabaseEnv {
  url: string;
  anonKey: string;
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** True once the two public Supabase variables are present. */
export function isSupabaseConfigured(): boolean {
  return getPublicSupabaseEnv() !== null;
}

/**
 * A safe, non-sensitive message for developer-facing UI when Supabase
 * isn't configured. Never shown to a real site visitor in production —
 * see `lib/supabase/env.ts` usage in `app/page.tsx` / dashboard layout.
 */
export const SUPABASE_MISSING_ENV_MESSAGE =
  "Supabase isn't configured yet. Copy .env.example to .env.local and fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY — see README.md for step-by-step setup.";

/** Only ever true outside production — safe to gate developer-only diagnostics on. */
export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV !== "production";
}
