import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardApp } from "@/components/dashboard/DashboardApp";
import type {
  BusinessRow,
  ConversationRow,
  HandoffRow,
  KnowledgeItemRow,
  LeadRow,
  WidgetSettingsRow,
} from "@/lib/supabase/database.types";

export default async function DashboardPage() {
  // The layout above this page already guarantees Supabase is
  // configured and the visitor is signed in.
  const supabase = (await createSupabaseServerClient())!;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user!.id)
    .limit(1)
    .maybeSingle();

  if (!business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <p className="font-semibold">No business found for this account.</p>
          <p className="mt-2">
            This shouldn&apos;t happen — a business is normally created automatically when you sign up. Please
            contact support, or check the <code>handle_new_user</code> trigger in Supabase.
          </p>
        </div>
      </div>
    );
  }

  const businessRow = business as BusinessRow;

  const [{ data: knowledgeItems }, { data: conversations }, { data: leads }, { data: handoffs }, { data: widgetSettings }] =
    await Promise.all([
      supabase.from("knowledge_items").select("*").eq("business_id", businessRow.id).order("sort_order"),
      supabase.from("conversations").select("*").eq("business_id", businessRow.id).order("created_at", { ascending: false }),
      supabase.from("leads").select("*").eq("business_id", businessRow.id).order("created_at", { ascending: false }),
      supabase.from("handoffs").select("*").eq("business_id", businessRow.id).order("created_at", { ascending: false }),
      supabase.from("widget_settings").select("*").eq("business_id", businessRow.id).maybeSingle(),
    ]);

  return (
    <DashboardApp
      ownerEmail={user!.email ?? ""}
      business={businessRow}
      knowledgeItems={(knowledgeItems as KnowledgeItemRow[]) ?? []}
      conversations={(conversations as ConversationRow[]) ?? []}
      leads={(leads as LeadRow[]) ?? []}
      handoffs={(handoffs as HandoffRow[]) ?? []}
      widgetSettings={(widgetSettings as WidgetSettingsRow | null) ?? null}
    />
  );
}
