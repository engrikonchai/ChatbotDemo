import { Handshake, MessageSquareText, TrendingUp, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { Lead, StoredConversation } from "@/lib/storage/types";

function conversionRate(leads: Lead[], conversations: StoredConversation[]): number {
  if (conversations.length === 0) return 0;
  return Math.round((leads.length / conversations.length) * 100);
}

export function OverviewPanel({
  leads,
  conversations,
}: {
  leads: Lead[];
  conversations: StoredConversation[];
}) {
  const metrics = [
    {
      icon: UserPlus,
      label: "New enquiries",
      value: leads.filter((lead) => lead.status === "new").length,
      hint: `${leads.length} total`,
    },
    {
      icon: MessageSquareText,
      label: "Total conversations",
      value: conversations.length,
      hint: "stored on this device",
    },
    {
      icon: TrendingUp,
      label: "Conversion rate",
      value: `${conversionRate(leads, conversations)}%`,
      hint: "conversations → enquiries",
    },
    {
      icon: Handshake,
      label: "Human hand-offs",
      value: leads.filter((lead) => lead.source === "handoff").length,
      hint: "sent to the host directly",
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(({ icon: Icon, label, value, hint }) => (
        <Card key={label} className="p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-adriatic-light text-adriatic-dark">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-navy/50">{label}</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-navy">{value}</p>
          <p className="mt-0.5 text-xs text-navy/45">{hint}</p>
        </Card>
      ))}
    </div>
  );
}
