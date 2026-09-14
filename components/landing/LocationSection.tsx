import { Landmark, MapPin, Waves } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { APARTMENT_INFO } from "@/lib/chat/knowledge";

export function LocationSection() {
  return (
    <section id="location" className="bg-sand-light py-16 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading
            eyebrow="Location"
            title="Central, walkable Budva"
            description="Tucked in a quiet residential pocket of Budva, close enough to walk everywhere that matters — the beach, the Old Town, cafés and the marina."
          />

          <ul className="mt-8 space-y-4">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-adriatic text-white">
                <Waves className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-navy">Nearest beach</p>
                <p className="text-sm text-navy/65">{APARTMENT_INFO.beachDistance}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-adriatic text-white">
                <Landmark className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-navy">Budva Old Town</p>
                <p className="text-sm text-navy/65">{APARTMENT_INFO.oldTownDistance}</p>
              </div>
            </li>
          </ul>

          <p className="mt-6 text-sm text-navy/55">
            Exact address is shared with confirmed guests. Our assistant can point you in the right
            direction any time.
          </p>
        </div>

        <Card className="relative aspect-[4/3] overflow-hidden p-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(26,111,163,0.14),transparent_55%),radial-gradient(circle_at_75%_65%,rgba(203,179,132,0.35),transparent_50%)]" />
          <svg
            className="absolute inset-0 h-full w-full text-navy/10"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <div className="absolute left-[42%] top-[48%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white shadow-card">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="mt-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-navy shadow-card">
              Adria Stay
            </span>
          </div>

          <div className="absolute left-[70%] top-[75%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-adriatic text-white shadow-card">
              <Waves className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-navy/70 shadow-card">
              Beach · 8 min
            </span>
          </div>

          <div className="absolute left-[20%] top-[22%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sand-dark text-navy shadow-card">
              <Landmark className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-navy/70 shadow-card">
              Old Town · 15 min
            </span>
          </div>

          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-navy/50 shadow-card">
            Illustrative map — not to scale
          </p>
        </Card>
      </Container>
    </section>
  );
}
