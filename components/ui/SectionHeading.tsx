import { cn } from "@/lib/utils/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-adriatic">{eyebrow}</p>
      ) : null}
      <h2 className="font-serif text-3xl font-semibold leading-tight text-navy sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-relaxed text-navy/70">{description}</p> : null}
    </div>
  );
}
