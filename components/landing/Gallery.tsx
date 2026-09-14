import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

const GALLERY_IMAGES = [
  { seed: "adria-living", alt: "Living area with sofa and sea-toned cushions", span: "sm:col-span-2 sm:row-span-2" },
  { seed: "adria-kitchen", alt: "Compact modern kitchen with light wood cabinetry", span: "" },
  { seed: "adria-bedroom", alt: "Bedroom with a queen bed and linen curtains", span: "" },
  { seed: "adria-bathroom", alt: "Bright bathroom with a walk-in shower", span: "" },
  { seed: "adria-balcony", alt: "Balcony with two chairs overlooking Budva rooftops", span: "" },
  { seed: "adria-street", alt: "Cobbled street near the Old Town of Budva", span: "sm:col-span-2" },
];

export function Gallery() {
  return (
    <section id="gallery" className="py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow="Gallery" title="A closer look inside" />

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:[grid-auto-rows:12rem]">
          {GALLERY_IMAGES.map((image, index) => (
            <div
              key={image.seed}
              className={`relative overflow-hidden rounded-2xl bg-sand-light ${image.span}`}
            >
              <ImageWithFallback
                src={`https://picsum.photos/seed/${image.seed}/900/900`}
                alt={image.alt}
                fill
                sizes="(min-width: 640px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 hover:scale-105"
                loading={index < 2 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
