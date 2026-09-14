import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Overview } from "@/components/landing/Overview";
import { Amenities } from "@/components/landing/Amenities";
import { Gallery } from "@/components/landing/Gallery";
import { LocationSection } from "@/components/landing/LocationSection";
import { Reviews } from "@/components/landing/Reviews";
import { Footer } from "@/components/landing/Footer";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveActiveBusinessBySlug } from "@/lib/server/widget-service";
import { DEMO_BUSINESS_SLUG } from "@/lib/chat/knowledge";

// Resolves the widget id from Supabase on every request rather than
// baking it into the static build — the business's active state and
// widget id are server-side facts, not static content, and this also
// means a page built before Supabase env vars were configured on
// Vercel self-heals on the next request instead of caching `null` forever.
export const dynamic = "force-dynamic";

/**
 * Resolves the public widget id for the demo business, server-side,
 * without depending on who (if anyone) is currently signed in as an
 * owner. Only the non-secret `public_widget_id` ever crosses into the
 * client — never `business_id`, `owner_id`, or the service-role key
 * used to look it up. Returns `null` when Supabase isn't configured or
 * the business doesn't exist/isn't active; the widget itself decides
 * how to present that (a dev-only notice locally, nothing in
 * production — see components/chat/ChatWidget.tsx).
 */
async function resolvePublicWidgetId(): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const business = await resolveActiveBusinessBySlug(admin, DEMO_BUSINESS_SLUG);
  return business?.public_widget_id ?? null;
}

export default async function HomePage() {
  const publicWidgetId = await resolvePublicWidgetId();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only-focusable fixed left-2 top-2 z-50 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        <Hero />
        <Overview />
        <Amenities />
        <Gallery />
        <LocationSection />
        <Reviews />
      </main>
      <Footer />
      <ChatWidget publicWidgetId={publicWidgetId} />
    </>
  );
}
