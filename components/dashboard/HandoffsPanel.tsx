"use client";

import { Card } from "@/components/ui/Card";
import type { HandoffRow, HandoffStatus } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils/cn";

const STATUS_OPTIONS: HandoffStatus[] = ["new", "contacted", "resolved"];

const STATUS_STYLES: Record<HandoffStatus, string> = {
  new: "bg-adriatic-light text-adriatic-dark",
  contacted: "bg-sand-light text-navy/70",
  resolved: "bg-green-100 text-green-800",
};

interface HandoffsPanelProps {
  handoffs: HandoffRow[];
  onStatusChange: (id: string, status: HandoffStatus) => void;
}

export function HandoffsPanel({ handoffs, onStatusChange }: HandoffsPanelProps) {
  if (handoffs.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-navy/55">
        No hand-off requests yet. When a visitor asks to speak with a human, it will show up here.
      </Card>
    );
  }

  const sorted = [...handoffs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-3">
      {sorted.map((handoff) => (
        <Card key={handoff.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-navy">{handoff.customer_name || handoff.contact}</p>
              <p className="text-sm text-navy/60">{handoff.contact}</p>
            </div>
            <select
              aria-label={`Status for hand-off from ${handoff.contact}`}
              value={handoff.status}
              onChange={(e) => onStatusChange(handoff.id, e.target.value as HandoffStatus)}
              className={cn(
                "rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize",
                STATUS_STYLES[handoff.status],
              )}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          {handoff.question ? <p className="mt-3 text-sm text-navy/75">&ldquo;{handoff.question}&rdquo;</p> : null}
          <p className="mt-3 text-xs text-navy/40">
            {new Date(handoff.created_at).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </Card>
      ))}
    </div>
  );
}
