"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Waves } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { DemoBanner } from "@/components/dashboard/DemoBanner";
import { DemoControls } from "@/components/dashboard/DemoControls";
import { DashboardTabs, type DashboardTab } from "@/components/dashboard/DashboardTabs";
import { OverviewPanel } from "@/components/dashboard/OverviewPanel";
import { LeadsPanel } from "@/components/dashboard/LeadsPanel";
import { ConversationsPanel } from "@/components/dashboard/ConversationsPanel";
import { ApartmentInfoPanel } from "@/components/dashboard/ApartmentInfoPanel";
import { WidgetPreviewPanel } from "@/components/dashboard/WidgetPreviewPanel";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";
import { deleteLead, getLeads, updateLeadStatus } from "@/lib/storage/leads";
import { getConversations } from "@/lib/storage/conversations";
import { getSettings, updateSettings } from "@/lib/storage/settings";
import { createSampleLead, resetDemoData } from "@/lib/storage/demo";
import type { Lead, LeadStatus, StoredConversation, AppSettings } from "@/lib/storage/types";
import { DEFAULT_SETTINGS } from "@/lib/storage/settings";

export default function DashboardPage() {
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setLeads(getLeads());
    setConversations(getConversations());
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    // Intentional one-time hydration from LocalStorage, which doesn't
    // exist during server rendering — this can't be done during render
    // without a client/server markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    setHydrated(true);
  }, [refresh]);

  function handleStatusChange(id: string, status: LeadStatus) {
    updateLeadStatus(id, status);
    refresh();
  }

  function handleDelete(id: string) {
    deleteLead(id);
    refresh();
  }

  function handleSettingsChange(partial: Partial<AppSettings>) {
    updateSettings(partial);
    refresh();
  }

  function handleReset() {
    resetDemoData();
    refresh();
  }

  function handleCreateSample() {
    createSampleLead();
    refresh();
  }

  return (
    <div className="min-h-screen bg-warm">
      <header className="border-b border-navy/10 bg-white">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-serif text-lg font-semibold text-navy">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-adriatic text-white">
              <Waves className="h-4 w-4" aria-hidden="true" />
            </span>
            Adria Stay <span className="hidden text-navy/50 sm:inline">— Owner dashboard</span>
          </Link>
        </Container>
        <DemoBanner />
      </header>

      <Container className="py-6 sm:py-8">
        <div className="mb-6">
          <DemoControls onReset={handleReset} onCreateSample={handleCreateSample} />
        </div>

        <div className="rounded-t-2xl border border-b-0 border-navy/10 bg-white pt-1">
          <DashboardTabs active={tab} onChange={setTab} />
        </div>

        <div className="rounded-b-2xl border border-navy/10 bg-warm-soft/40 p-4 sm:p-6">
          {!hydrated ? (
            <p className="py-12 text-center text-sm text-navy/45">Loading dashboard data…</p>
          ) : (
            <>
              {tab === "overview" ? <OverviewPanel leads={leads} conversations={conversations} /> : null}
              {tab === "leads" ? (
                <LeadsPanel leads={leads} onStatusChange={handleStatusChange} onDelete={handleDelete} />
              ) : null}
              {tab === "conversations" ? <ConversationsPanel conversations={conversations} /> : null}
              {tab === "apartment" ? <ApartmentInfoPanel /> : null}
              {tab === "widget" ? <WidgetPreviewPanel /> : null}
              {tab === "settings" ? (
                <SettingsPanel settings={settings} onChange={handleSettingsChange} />
              ) : null}
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
