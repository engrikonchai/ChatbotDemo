-- Phase 2: runtime tables written by the public chat widget (via the
-- service-role /api/widget/* routes) and read/managed by the owner
-- dashboard (via the user's own session, subject to RLS).

-- ---------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  visitor_id text not null,
  channel text not null default 'website',
  detected_language text not null default 'en',
  status text not null default 'open',
  human_takeover boolean not null default false,
  lead_created boolean not null default false,
  -- Not part of the original table spec: holds the mock chat engine's
  -- serialized ConversationState (active flow + booking/hand-off draft)
  -- so a stateless HTTP request can resume a multi-step flow. There is
  -- nowhere else to persist this once the engine runs server-side.
  -- See README.md "Phase 2 implementation notes".
  flow_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_channel_check check (channel in ('website', 'instagram', 'whatsapp')),
  constraint conversations_status_check check (status in ('open', 'closed', 'handed_off'))
);

comment on table public.conversations is 'One row per chat session. visitor_id is a client-generated id, never an authenticated user.';

create index if not exists conversations_business_id_idx on public.conversations (business_id);
create index if not exists conversations_visitor_id_idx on public.conversations (visitor_id);
create index if not exists conversations_business_created_idx on public.conversations (business_id, created_at desc);

-- ---------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null,
  content text not null,
  intent text,
  created_at timestamptz not null default now(),
  constraint messages_role_check check (role in ('user', 'assistant', 'system')),
  constraint messages_content_length_check check (char_length(content) between 1 and 4000)
);

comment on table public.messages is 'Individual chat turns. Scoped to a business only indirectly, through conversation_id.';

create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  reference text not null unique,
  name text not null,
  contact text not null,
  check_in date,
  check_out date,
  guest_count integer,
  note text,
  language text not null default 'en',
  source text not null default 'website',
  status text not null default 'new',
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_status_check check (status in ('new', 'contacted', 'confirmed', 'lost')),
  constraint leads_source_check check (source in ('website', 'instagram', 'whatsapp')),
  constraint leads_guest_count_check check (guest_count is null or guest_count between 1 and 4),
  constraint leads_dates_check check (check_in is null or check_out is null or check_out > check_in)
);

comment on table public.leads is 'A booking enquiry. Never a confirmed reservation — status starts at new and is only ever updated by the owner.';

create index if not exists leads_business_id_idx on public.leads (business_id);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_business_created_idx on public.leads (business_id, created_at desc);

-- ---------------------------------------------------------------------
-- handoffs
-- ---------------------------------------------------------------------
create table if not exists public.handoffs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  customer_name text,
  contact text not null,
  question text,
  reason text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint handoffs_status_check check (status in ('new', 'contacted', 'resolved'))
);

comment on table public.handoffs is 'A visitor request to speak with the host directly.';

create index if not exists handoffs_business_id_idx on public.handoffs (business_id);
create index if not exists handoffs_business_created_idx on public.handoffs (business_id, created_at desc);

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create trigger set_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.handoffs
  for each row execute function public.set_updated_at();
