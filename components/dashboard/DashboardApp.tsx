"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Waves } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { DemoBanner } from "@/components/dashboard/DemoBanner";
import { DemoControls } from "@/components/dashboard/DemoControls";
import { DashboardTabs, type DashboardTab } from "@/components/dashboard/DashboardTabs";
import { OverviewPanel } from "@/components/dashboard/OverviewPanel";
import { LeadsPanel } from "@/components/dashboard/LeadsPanel";
import { ConversationsPanel } from "@/components/dashboard/ConversationsPanel";
import { HandoffsPanel } from "@/components/dashboard/HandoffsPanel";
import { ApartmentInfoPanel } from "@/components/dashboard/ApartmentInfoPanel";
import { WidgetPreviewPanel } from "@/components/dashboard/WidgetPreviewPanel";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";
import type {
  BusinessRow,
  ConversationRow,
  HandoffRow,
  HandoffStatus,
  KnowledgeItemRow,
  LeadRow,
  LeadStatus,
  WidgetSettingsRow,
} from "@/lib/supabase/database.types";
import type { Language } from "@/lib/chat/types";
import {
  closeConversationAction,
  createSampleLeadAction,
  deleteLeadAction,
  resetDemoDataAction,
  setConversationTakeoverAction,
  setKnowledgeItemActiveAction,
  signOutAction,
  updateHandoffStatusAction,
  updateKnowledgeItemAction,
  updateLeadStatusAction,
  updateSupportedLanguagesAction,
  updateWidgetSettingsAction,
  type KnowledgeItemEdit,
  type WidgetSettingsEdit,
} from "@/app/dashboard/actions";

interface DashboardAppProps {
  ownerEmail: string;
  business: BusinessRow;
  knowledgeItems: KnowledgeItemRow[];
  conversations: ConversationRow[];
  leads: LeadRow[];
  handoffs: HandoffRow[];
  widgetSettings: WidgetSettingsRow | null;
}

export function DashboardApp({
  ownerEmail,
  business,
  knowledgeItems,
  conversations,
  leads,
  handoffs,
  widgetSettings,
}: DashboardAppProps) {
  const router = useRouter();
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [, startTransition] = useTransition();

  /** Re-runs the Server Component fetch so every panel reflects the latest data. */
  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div className="min-h-screen bg-warm">
      <header className="border-b border-navy/10 bg-white">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-serif text-lg font-semibold text-navy">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-adriatic text-white">
              <Waves className="h-4 w-4" aria-hidden="true" />
            </span>
            {business.name} <span className="hidden text-navy/50 sm:inline">— Owner dashboard</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-navy/50 sm:inline">{ownerEmail}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-3.5 py-1.5 text-sm font-medium text-navy hover:bg-sand-light"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </Container>
        <DemoBanner />
      </header>

      <Container className="py-6 sm:py-8">
        <div className="mb-6">
          <DemoControls
            onReset={() => {
              startTransition(async () => {
                await resetDemoDataAction();
                router.refresh();
              });
            }}
            onCreateSample={() => {
              startTransition(async () => {
                await createSampleLeadAction();
                router.refresh();
              });
            }}
          />
        </div>

        <div className="rounded-t-2xl border border-b-0 border-navy/10 bg-white pt-1">
          <DashboardTabs active={tab} onChange={setTab} />
        </div>

        <div className="rounded-b-2xl border border-navy/10 bg-warm-soft/40 p-4 sm:p-6">
          {tab === "overview" ? <OverviewPanel leads={leads} conversations={conversations} handoffs={handoffs} /> : null}

          {tab === "leads" ? (
            <LeadsPanel
              leads={leads}
              onStatusChange={(id: string, status: LeadStatus) => {
                startTransition(async () => {
                  await updateLeadStatusAction(id, status);
                  router.refresh();
                });
              }}
              onDelete={(id: string) => {
                startTransition(async () => {
                  await deleteLeadAction(id);
                  router.refresh();
                });
              }}
            />
          ) : null}

          {tab === "conversations" ? (
            <ConversationsPanel
              conversations={conversations}
              onTakeoverChange={(id: string, takeover: boolean) => {
                startTransition(async () => {
                  await setConversationTakeoverAction(id, takeover);
                  router.refresh();
                });
              }}
              onClose={(id: string) => {
                startTransition(async () => {
                  await closeConversationAction(id);
                  router.refresh();
                });
              }}
            />
          ) : null}

          {tab === "handoffs" ? (
            <HandoffsPanel
              handoffs={handoffs}
              onStatusChange={(id: string, status: HandoffStatus) => {
                startTransition(async () => {
                  await updateHandoffStatusAction(id, status);
                  router.refresh();
                });
              }}
            />
          ) : null}

          {tab === "apartment" ? (
            <ApartmentInfoPanel
              items={knowledgeItems}
              onSave={(id: string, edit: KnowledgeItemEdit) => {
                startTransition(async () => {
                  await updateKnowledgeItemAction(id, edit);
                  refresh();
                });
              }}
              onToggleActive={(id: string, isActive: boolean) => {
                startTransition(async () => {
                  await setKnowledgeItemActiveAction(id, isActive);
                  refresh();
                });
              }}
            />
          ) : null}

          {tab === "widget" ? <WidgetPreviewPanel /> : null}

          {tab === "settings" ? (
            <SettingsPanel
              business={business}
              widgetSettings={widgetSettings}
              onLanguagesChange={(languages: Language[]) => {
                startTransition(async () => {
                  await updateSupportedLanguagesAction(languages);
                  refresh();
                });
              }}
              onWidgetSettingsChange={(edit: Partial<WidgetSettingsEdit>) => {
                startTransition(async () => {
                  await updateWidgetSettingsAction(edit);
                  refresh();
                });
              }}
              onRepaired={refresh}
            />
          ) : null}
        </div>
      </Container>
    </div>
  );
}
