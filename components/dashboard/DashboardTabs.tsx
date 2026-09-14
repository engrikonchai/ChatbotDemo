"use client";

import { cn } from "@/lib/utils/cn";

export type DashboardTab =
  | "overview"
  | "leads"
  | "conversations"
  | "handoffs"
  | "apartment"
  | "widget"
  | "settings";

const TABS: { id: DashboardTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "leads", label: "Leads" },
  { id: "conversations", label: "Conversations" },
  { id: "handoffs", label: "Hand-offs" },
  { id: "apartment", label: "Apartment info" },
  { id: "widget", label: "Widget preview" },
  { id: "settings", label: "Settings" },
];

export function DashboardTabs({ active, onChange }: { active: DashboardTab; onChange: (tab: DashboardTab) => void }) {
  return (
    <div role="tablist" aria-label="Dashboard sections" className="flex gap-1 overflow-x-auto px-4 sm:px-6">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors",
            active === tab.id
              ? "border-adriatic text-adriatic-dark"
              : "border-transparent text-navy/55 hover:text-navy",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
