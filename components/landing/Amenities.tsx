import {
  Banknote,
  CarFront,
  CigaretteOff,
  Landmark,
  PawPrint,
  PlaneTakeoff,
  Waves,
  Wifi,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { APARTMENT_INFO } from "@/lib/chat/knowledge";

const AMENITIES = [
  { icon: CarFront, title: "Free private parking", description: APARTMENT_INFO.parking },
  { icon: Wifi, title: "Free Wi-Fi", description: APARTMENT_INFO.wifi },
  { icon: PawPrint, title: "Pet-friendly", description: APARTMENT_INFO.pets },
  { icon: CigaretteOff, title: "Non-smoking", description: `${APARTMENT_INFO.smoking} inside the apartment.` },
  { icon: PlaneTakeoff, title: "Airport transfer", description: APARTMENT_INFO.airportTransfer },
  { icon: Waves, title: "Close to the beach", description: `${APARTMENT_INFO.beachDistance} from the apartment.` },
  { icon: Landmark, title: "Near the Old Town", description: `${APARTMENT_INFO.oldTownDistance} from the apartment.` },
  { icon: Banknote, title: "Simple payment", description: `${APARTMENT_INFO.payment}, once your stay is confirmed.` },
];

export function Amenities() {
  return (
    <section id="amenities" className="bg-sand-light py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Amenities"
          title="Everything set up, nothing overcomplicated"
          description="The practical details, listed plainly — exactly what our chat assistant will tell you too."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AMENITIES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-adriatic text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-serif text-base font-semibold text-navy">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-navy/65">{description}</p>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-navy/55">
          Availability, exact pricing and transfer costs are always confirmed directly by the host.
        </p>
      </Container>
    </section>
  );
}
