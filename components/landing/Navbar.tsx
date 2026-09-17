"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Waves, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { openNewWidget } from "@/lib/widget/open-new-widget";

const NAV_LINKS = [
  { href: "#overview", label: "Overview" },
  { href: "#amenities", label: "Amenities" },
  { href: "#gallery", label: "Gallery" },
  { href: "#location", label: "Location" },
  { href: "#reviews", label: "Reviews" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-warm/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between sm:h-20">
        <Link href="#top" className="flex items-center gap-2 font-serif text-lg font-semibold text-navy">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-adriatic text-white">
            <Waves className="h-5 w-5" aria-hidden="true" />
          </span>
          Adria Stay <span className="text-adriatic">Budva</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-navy/70 transition-colors hover:text-adriatic"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <button
            type="button"
            onClick={() => openNewWidget()}
            className="rounded-full bg-adriatic px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-adriatic-dark"
          >
            Check availability
          </button>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-navy md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      {open ? (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-navy/10 bg-warm md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy/80 hover:bg-sand-light"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openNewWidget();
              }}
              className="mt-2 rounded-full bg-adriatic px-5 py-2.5 text-sm font-semibold text-white"
            >
              Check availability
            </button>
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
