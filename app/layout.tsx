import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adria Stay Budva — Boutique Apartment in Budva, Montenegro",
  description:
    "A modern one-bedroom apartment in Budva, Montenegro. 8 minutes from the beach, 15 minutes from the Old Town. Free parking & Wi-Fi. Ask our assistant anything.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-warm text-navy">{children}</body>
    </html>
  );
}
