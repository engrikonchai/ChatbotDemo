import { CalendarClock, Globe2, Home, Users } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { APARTMENT_INFO } from "@/lib/chat/knowledge";

const OVERVIEW_ITEMS = [
  {
    icon: Home,
    label: "Property type",
    value: APARTMENT_INFO.propertyType,
  },
  {
    icon: Users,
    label: "Maximum guests",
    value: `Up to ${APARTMENT_INFO.maxGuests} guests`,
  },
  {
    icon: CalendarClock,
    label: "Check-in / check-out",
    value: `From ${APARTMENT_INFO.checkInTime} · Until ${APARTMENT_INFO.checkOutTime}`,
  },
  {
    icon: Globe2,
    label: "Spoken languages",
    value: APARTMENT_INFO.languages.join(", "),
  },
];

export function Overview() {
  return (
    <section id="overview" className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Overview"
          title="A calm, modern base in Budva"
          description="One bright one-bedroom apartment, thoughtfully finished and hosted with real care — not a large complex, just a genuinely good place to stay."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {OVERVIEW_ITEMS.map(({ icon: Icon, label, value }) => (
            <Card key={label} className="p-6 transition-shadow hover:shadow-card-hover">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-adriatic-light text-adriatic-dark">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-navy/50">{label}</p>
              <p className="mt-1 font-serif text-lg font-semibold text-navy">{value}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
