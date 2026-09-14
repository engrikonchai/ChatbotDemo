import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

/**
 * Runs on every request to a protected route. Two jobs:
 *
 * 1. Refresh the Supabase session cookies (so a session doesn't silently
 *    expire mid-visit) by calling `auth.getUser()`.
 * 2. An *optimistic* redirect to /login when there's no session.
 *
 * This is a fast-path convenience only — it is not the real security
 * boundary. The actual enforcement is `app/dashboard/layout.tsx`
 * (a Server Component that re-checks the session) and Row Level
 * Security on every table. Per Next.js's own guidance, Proxy should
 * never be relied on as the sole authorization mechanism.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = getPublicSupabaseEnv();
  if (!env) {
    // Supabase isn't configured — let the request through; the
    // dashboard layout shows a clear developer-only setup notice.
    return response;
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
