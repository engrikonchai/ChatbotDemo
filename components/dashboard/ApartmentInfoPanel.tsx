import { Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { APARTMENT_INFO } from "@/lib/chat/knowledge";

const FIELDS: Array<{ label: string; value: string }> = [
  { label: "Name", value: APARTMENT_INFO.name },
  { label: "Location", value: APARTMENT_INFO.location },
  { label: "Property type", value: APARTMENT_INFO.propertyType },
  { label: "Maximum guests", value: String(APARTMENT_INFO.maxGuests) },
  { label: "Languages spoken", value: APARTMENT_INFO.languages.join(", ") },
  { label: "Check-in", value: `From ${APARTMENT_INFO.checkInTime}` },
  { label: "Check-out", value: `By ${APARTMENT_INFO.checkOutTime}` },
  { label: "Parking", value: APARTMENT_INFO.parking },
  { label: "Wi-Fi", value: APARTMENT_INFO.wifi },
  { label: "Pets", value: APARTMENT_INFO.pets },
  { label: "Smoking", value: APARTMENT_INFO.smoking },
  { label: "Airport transfer", value: APARTMENT_INFO.airportTransfer },
  { label: "Beach distance", value: APARTMENT_INFO.beachDistance },
  { label: "Old Town distance", value: APARTMENT_INFO.oldTownDistance },
  { label: "Payment", value: APARTMENT_INFO.payment },
  { label: "Availability", value: APARTMENT_INFO.availability },
];

export function ApartmentInfoPanel() {
  return (
    <div className="space-y-5">
      <Card className="flex items-start gap-3 border-adriatic/20 bg-adriatic-light/40 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-adriatic-dark" aria-hidden="true" />
        <p className="text-sm text-navy/70">
          This is the exact knowledge the chat assistant answers from (
          <code className="rounded bg-white px-1 py-0.5 text-xs">lib/chat/knowledge.ts</code>). Editing
          this from the dashboard will be added once the database phase lands.
        </p>
      </Card>

      <Card className="overflow-hidden p-0">
        <dl className="divide-y divide-navy/5">
          {FIELDS.map((field) => (
            <div key={field.label} className="grid gap-1 px-5 py-3.5 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-semibold text-navy/50">{field.label}</dt>
              <dd className="text-sm text-navy sm:col-span-2">{field.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
