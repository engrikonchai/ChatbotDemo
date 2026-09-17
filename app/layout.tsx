import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import { NEW_WIDGET_ID, NEW_WIDGET_SCRIPT_SRC } from "@/lib/widget/new-widget-config";

export const metadata: Metadata = {
  title: "Adria Stay Budva — Boutique Apartment in Budva, Montenegro",
  description:
    "A modern one-bedroom apartment in Budva, Montenegro. 8 minutes from the beach, 15 minutes from the Old Town. Free parking & Wi-Fi. Ask our assistant anything.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-warm text-navy">
        {children}
        {/*
          The ai-receptionist-platform widget, installed once here so it
          loads on every page. `data-widget-id` is a public identifier,
          not a secret — see lib/widget/new-widget-config.ts.
        */}
        <Script
          id="ai-receptionist-widget-loader"
          src={NEW_WIDGET_SCRIPT_SRC}
          data-widget-id={NEW_WIDGET_ID}
          strategy="afterInteractive"
          async
        />
      </body>
    </html>
  );
}
