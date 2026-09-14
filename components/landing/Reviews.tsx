import { Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";

const DEMO_REVIEWS = [
  {
    name: "Sofia M.",
    origin: "Italy",
    rating: 5,
    text: "Spotless apartment, wonderful host communication, and the beach really is a short stroll away. Would happily stay again.",
  },
  {
    name: "Dimitri K.",
    origin: "Serbia",
    rating: 5,
    text: "Parking made everything so much easier, and the Old Town was an easy evening walk. Exactly as described.",
  },
  {
    name: "Anna V.",
    origin: "Russia",
    rating: 4,
    text: "Very comfortable stay, host answered every question quickly through the chat. Would recommend for a couple or small family.",
  },
];

export function Reviews() {
  return (
    <section id="reviews" className="py-16 sm:py-24">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading eyebrow="Guest reviews" title="What guests have said" />
          <span className="inline-flex w-fit items-center rounded-full border border-sand-dark bg-sand-light px-3 py-1 text-xs font-semibold text-navy/60">
            Example reviews — demo content
          </span>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {DEMO_REVIEWS.map((review) => (
            <Card key={review.name} className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={
                      index < review.rating
                        ? "h-4 w-4 fill-adriatic text-adriatic"
                        : "h-4 w-4 text-navy/15"
                    }
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-navy/75">&ldquo;{review.text}&rdquo;</p>
              <p className="mt-auto text-sm font-semibold text-navy">
                {review.name} <span className="font-normal text-navy/50">· {review.origin}</span>
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
