-- Phase 2: Row Level Security.
--
-- Every table is owner-scoped through `businesses.owner_id = auth.uid()`.
-- There are deliberately NO policies granting the `anon` role any access
-- to any of these tables: the public chat widget never talks to
-- Supabase directly. It calls the /api/widget/* Route Handlers, which
-- use the service-role key (bypassing RLS) and perform their own
-- authorization by resolving and validating `public_widget_id` in
-- application code. This is what the brief means by "must NOT write
-- directly to private Supabase tables using unrestricted anonymous
-- policies" — the safest way to guarantee that is to grant anon
-- nothing at all here.

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;
alter table public.handoffs enable row level security;
alter table public.widget_settings enable row level security;

-- ---------------------------------------------------------------------
-- profiles — an owner may read/update only their own row.
-- ---------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- businesses — full CRUD, scoped to rows the owner actually owns.
-- ---------------------------------------------------------------------
create policy "businesses_select_own" on public.businesses
  for select using (owner_id = auth.uid());

create policy "businesses_insert_own" on public.businesses
  for insert with check (owner_id = auth.uid());

create policy "businesses_update_own" on public.businesses
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "businesses_delete_own" on public.businesses
  for delete using (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- knowledge_items — scoped through the parent business.
-- ---------------------------------------------------------------------
create policy "knowledge_items_select_own" on public.knowledge_items
  for select using (
    exists (select 1 from public.businesses b where b.id = knowledge_items.business_id and b.owner_id = auth.uid())
  );

create policy "knowledge_items_insert_own" on public.knowledge_items
  for insert with check (
    exists (select 1 from public.businesses b where b.id = knowledge_items.business_id and b.owner_id = auth.uid())
  );

create policy "knowledge_items_update_own" on public.knowledge_items
  for update using (
    exists (select 1 from public.businesses b where b.id = knowledge_items.business_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.businesses b where b.id = knowledge_items.business_id and b.owner_id = auth.uid())
  );

create policy "knowledge_items_delete_own" on public.knowledge_items
  for delete using (
    exists (select 1 from public.businesses b where b.id = knowledge_items.business_id and b.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- conversations — scoped through the parent business.
-- ---------------------------------------------------------------------
create policy "conversations_select_own" on public.conversations
  for select using (
    exists (select 1 from public.businesses b where b.id = conversations.business_id and b.owner_id = auth.uid())
  );

create policy "conversations_update_own" on public.conversations
  for update using (
    exists (select 1 from public.businesses b where b.id = conversations.business_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.businesses b where b.id = conversations.business_id and b.owner_id = auth.uid())
  );

create policy "conversations_delete_own" on public.conversations
  for delete using (
    exists (select 1 from public.businesses b where b.id = conversations.business_id and b.owner_id = auth.uid())
  );

-- No insert policy for the authenticated-owner role: conversations are
-- only ever created by the service-role widget routes.

-- ---------------------------------------------------------------------
-- messages — scoped through conversations -> businesses.
-- ---------------------------------------------------------------------
create policy "messages_select_own" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      join public.businesses b on b.id = c.business_id
      where c.id = messages.conversation_id and b.owner_id = auth.uid()
    )
  );

create policy "messages_delete_own" on public.messages
  for delete using (
    exists (
      select 1 from public.conversations c
      join public.businesses b on b.id = c.business_id
      where c.id = messages.conversation_id and b.owner_id = auth.uid()
    )
  );

-- No insert/update policy for the authenticated-owner role: messages are
-- only ever written by the service-role widget routes.

-- ---------------------------------------------------------------------
-- leads — scoped through the parent business.
-- ---------------------------------------------------------------------
create policy "leads_select_own" on public.leads
  for select using (
    exists (select 1 from public.businesses b where b.id = leads.business_id and b.owner_id = auth.uid())
  );

create policy "leads_insert_own" on public.leads
  for insert with check (
    exists (select 1 from public.businesses b where b.id = leads.business_id and b.owner_id = auth.uid())
  );

create policy "leads_update_own" on public.leads
  for update using (
    exists (select 1 from public.businesses b where b.id = leads.business_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.businesses b where b.id = leads.business_id and b.owner_id = auth.uid())
  );

create policy "leads_delete_own" on public.leads
  for delete using (
    exists (select 1 from public.businesses b where b.id = leads.business_id and b.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- handoffs — scoped through the parent business.
-- ---------------------------------------------------------------------
create policy "handoffs_select_own" on public.handoffs
  for select using (
    exists (select 1 from public.businesses b where b.id = handoffs.business_id and b.owner_id = auth.uid())
  );

create policy "handoffs_update_own" on public.handoffs
  for update using (
    exists (select 1 from public.businesses b where b.id = handoffs.business_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.businesses b where b.id = handoffs.business_id and b.owner_id = auth.uid())
  );

create policy "handoffs_delete_own" on public.handoffs
  for delete using (
    exists (select 1 from public.businesses b where b.id = handoffs.business_id and b.owner_id = auth.uid())
  );

-- No insert policy for the authenticated-owner role: hand-offs are only
-- ever created by the service-role widget routes.

-- ---------------------------------------------------------------------
-- widget_settings — scoped through the parent business.
-- ---------------------------------------------------------------------
create policy "widget_settings_select_own" on public.widget_settings
  for select using (
    exists (select 1 from public.businesses b where b.id = widget_settings.business_id and b.owner_id = auth.uid())
  );

create policy "widget_settings_update_own" on public.widget_settings
  for update using (
    exists (select 1 from public.businesses b where b.id = widget_settings.business_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.businesses b where b.id = widget_settings.business_id and b.owner_id = auth.uid())
  );

-- No insert policy for the authenticated-owner role: the default row is
-- created by the onboarding trigger.
