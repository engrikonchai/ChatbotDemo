import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Overview } from "@/components/landing/Overview";
import { Amenities } from "@/components/landing/Amenities";
import { Gallery } from "@/components/landing/Gallery";
import { LocationSection } from "@/components/landing/LocationSection";
import { Reviews } from "@/components/landing/Reviews";
import { Footer } from "@/components/landing/Footer";
import { ChatWidget } from "@/components/chat/ChatWidget";

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
      <ChatWidget />
    </>
  );
}
