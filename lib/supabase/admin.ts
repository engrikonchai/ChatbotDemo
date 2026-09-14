import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely —
 * only ever import this from trusted server-only code (the `/api/widget/*`
 * route handlers) that performs its own authorization checks (resolving
 * and validating the business via `public_widget_id`) before touching
 * any table. Never import this file from a client component: the
 * `server-only` package makes that a build error, not just a lint
 * warning, so the service-role key can never end up in a browser bundle.
 *
 * Returns `null` when the service-role key isn't configured, so the
 * public widget API routes can fail safely instead of crashing.
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
