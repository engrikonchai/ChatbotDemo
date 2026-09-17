import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Overview } from "@/components/landing/Overview";
import { Amenities } from "@/components/landing/Amenities";
import { Gallery } from "@/components/landing/Gallery";
import { LocationSection } from "@/components/landing/LocationSection";
import { Reviews } from "@/components/landing/Reviews";
import { Footer } from "@/components/landing/Footer";

// The old in-house chat widget (components/chat/ChatWidget.tsx) has been
// superseded by the ai-receptionist-platform widget, installed globally
// via the <Script> tag in app/layout.tsx. Its mounting is disabled here
// — not deleted — so the migration can be rolled back by restoring the
// import and the <ChatWidget publicWidgetId={...} /> render below. The
// backing API routes (app/api/widget/*), lib/server/widget-service.ts
// and lib/chat/* are all left in place for the same reason; see
// tests/widget-migration.test.ts for the regression coverage pinning
// "exactly one widget mounts."

export default function HomePage() {
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
    </>
  );
}
