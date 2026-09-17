"use client";

import { MapPin, ShieldCheck, Waves } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Badge } from "@/components/ui/Badge";
import { openNewWidget } from "@/lib/widget/open-new-widget";
import { APARTMENT_INFO } from "@/lib/chat/knowledge";

const FACTS = [
  { label: "Beach", value: APARTMENT_INFO.beachDistance },
  { label: "Old Town", value: APARTMENT_INFO.oldTownDistance },
  { label: "Guests", value: `Up to ${APARTMENT_INFO.maxGuests}` },
  { label: "Parking", value: "Free & private" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <Container className="grid gap-8 py-8 sm:gap-10 sm:py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="animate-fade-slide-up">
          <Badge>
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Budva, Montenegro
          </Badge>
          <h1 className="mt-4 font-serif text-3xl font-semibold leading-[1.1] text-navy sm:mt-5 sm:text-5xl lg:text-6xl">
            A boutique stay on the Adriatic coast
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-navy/70 sm:mt-5 sm:text-lg">
            {APARTMENT_INFO.propertyType} in the heart of Budva — bright, comfortable and steps from
            everything that makes the old Adriatic town worth visiting. Hosted directly, with real answers
            from our assistant, any time of day.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => openNewWidget()}
              className="inline-flex items-center justify-center rounded-full bg-adriatic px-7 py-3 text-base font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:bg-adriatic-dark sm:py-3.5"
            >
              Check availability
            </button>
            <a
              href="#overview"
              className="inline-flex items-center justify-center rounded-full border border-navy/15 px-7 py-3 text-base font-semibold text-navy transition-colors hover:bg-sand-light sm:py-3.5"
            >
              Explore the apartment
            </a>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:mt-10 sm:gap-y-5">
            {FACTS.map((fact) => (
              <div key={fact.label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">{fact.label}</p>
                <p className="mt-1 font-serif text-lg font-semibold text-navy">{fact.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-card sm:aspect-[5/4] lg:aspect-[4/5]">
            <ImageWithFallback
              src="https://picsum.photos/seed/adria-hero/1200/1500"
              alt="Sunlit living room of the Adria Stay Budva apartment, with sea-facing balcony doors"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 hidden max-w-[15rem] items-start gap-3 rounded-2xl border border-navy/10 bg-white p-4 shadow-card sm:flex">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-adriatic-light text-adriatic-dark">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy">Hosted directly</p>
              <p className="text-xs text-navy/60">Availability always confirmed by the host</p>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 hidden items-center gap-2 rounded-full border border-navy/10 bg-white px-4 py-2 shadow-card sm:flex">
            <Waves className="h-4 w-4 text-adriatic" aria-hidden="true" />
            <span className="text-xs font-semibold text-navy">Adriatic coast</span>
          </div>
        </div>
      </Container>
    </section>
  );
}
