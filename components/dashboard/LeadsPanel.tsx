"use client";

import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { LANGUAGE_LABELS } from "@/lib/chat/translations";
import type { Language } from "@/lib/chat/types";
import { formatDisplayDate } from "@/lib/utils/date";
import type { LeadRow, LeadStatus } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils/cn";

const STATUS_OPTIONS: LeadStatus[] = ["new", "contacted", "confirmed", "lost"];

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-adriatic-light text-adriatic-dark",
  contacted: "bg-sand-light text-navy/70",
  confirmed: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-700",
};

interface LeadsPanelProps {
  leads: LeadRow[];
  onStatusChange: (id: string, status: LeadStatus) => void;
  onDelete: (id: string) => void;
}

function languageLabel(language: string): string {
  return LANGUAGE_LABELS[language as Language] ?? language;
}

function formatDateRange(lead: LeadRow): string {
  if (!lead.check_in && !lead.check_out) return "—";
  const inPart = lead.check_in ? formatDisplayDate(lead.check_in) : "?";
  const outPart = lead.check_out ? formatDisplayDate(lead.check_out) : "?";
  return `${inPart} → ${outPart}`;
}

export function LeadsPanel({ leads, onStatusChange, onDelete }: LeadsPanelProps) {
  if (leads.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-navy/55">
        No enquiries yet. Try the chat widget on the website, or use “Create sample lead” to see how this
        looks.
      </Card>
    );
  }

  const sorted = [...leads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead>
          <tr className="border-b border-navy/10 text-xs font-semibold uppercase tracking-wide text-navy/45">
            <th className="px-4 py-3">Reference</th>
            <th className="px-4 py-3">Guest</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Dates</th>
            <th className="px-4 py-3">Guests</th>
            <th className="px-4 py-3">Language</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3 text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((lead) => (
            <tr key={lead.id} className="border-b border-navy/5 last:border-0">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-navy">{lead.reference}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-navy">{lead.name || "—"}</p>
                <p className="text-xs uppercase tracking-wide text-navy/40">{lead.source}</p>
              </td>
              <td className="px-4 py-3 text-navy/75">{lead.contact}</td>
              <td className="px-4 py-3 text-navy/75">{formatDateRange(lead)}</td>
              <td className="px-4 py-3 text-navy/75">{lead.guest_count ?? "—"}</td>
              <td className="px-4 py-3 text-navy/75">{languageLabel(lead.language)}</td>
              <td className="px-4 py-3">
                <select
                  aria-label={`Status for ${lead.reference}`}
                  value={lead.status}
                  onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                  className={cn(
                    "rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize focus-visible:outline-adriatic",
                    STATUS_STYLES[lead.status],
                  )}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-navy/55">
                {new Date(lead.created_at).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  aria-label={`Delete lead ${lead.reference}`}
                  onClick={() => {
                    if (window.confirm(`Delete enquiry ${lead.reference}? This cannot be undone.`)) {
                      onDelete(lead.id);
                    }
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-navy/40 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
