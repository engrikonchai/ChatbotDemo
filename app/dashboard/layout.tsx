import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, SUPABASE_MISSING_ENV_MESSAGE } from "@/lib/supabase/env";

// The dashboard is always per-user, cookie-authenticated content — never
// prerender or statically cache it. This also avoids a build-time crash
// when Supabase env vars aren't set (Next would otherwise try to
// prerender this route since nothing forces dynamic rendering before
// `createSupabaseServerClient()` short-circuits on the missing config).
export const dynamic = "force-dynamic";

/**
 * The real authorization boundary for every /dashboard route. `proxy.ts`
 * also does an optimistic redirect for a snappier "logged out" bounce,
 * but per Next's own guidance that's a fast-path convenience only —
 * this Server Component re-checks the session on every request and is
 * what actually keeps the dashboard private.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm px-4">
        <div className="max-w-md rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
          <p className="font-semibold">Dev only — Supabase not configured</p>
          <p className="mt-2">{SUPABASE_MISSING_ENV_MESSAGE}</p>
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  return <>{children}</>;
}
