-- Phase 2: core, owner-configured tables (profiles, businesses, knowledge,
-- widget settings). Conversation/runtime tables are in the next migration.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per authenticated owner, mirroring auth.users.';

-- ---------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  public_widget_id uuid not null unique default gen_random_uuid(),
  business_type text not null,
  location text,
  default_language text not null default 'en',
  supported_languages text[] not null default array['en', 'me', 'ru'],
  handoff_email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_supported_languages_not_empty check (cardinality(supported_languages) > 0)
);

comment on table public.businesses is 'One row per apartment/business. public_widget_id is the only identifier the public chat widget ever sends.';

create index if not exists businesses_owner_id_idx on public.businesses (owner_id);
create unique index if not exists businesses_public_widget_id_idx on public.businesses (public_widget_id);

-- ---------------------------------------------------------------------
-- knowledge_items
-- ---------------------------------------------------------------------
create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  category text not null,
  question text not null,
  answer_en text not null,
  answer_me text,
  answer_ru text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.knowledge_items is 'Verified FAQ knowledge shown/edited in the owner dashboard, seeded from lib/chat/knowledge.ts at signup.';

create index if not exists knowledge_items_business_id_idx on public.knowledge_items (business_id);
create index if not exists knowledge_items_business_sort_idx on public.knowledge_items (business_id, sort_order);

-- ---------------------------------------------------------------------
-- widget_settings
-- ---------------------------------------------------------------------
create table if not exists public.widget_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  title text not null default 'Adria Assistant',
  welcome_message_en text,
  welcome_message_me text,
  welcome_message_ru text,
  primary_color text not null default '#1677ff',
  position text not null default 'bottom-right',
  mock_ai_enabled boolean not null default true,
  human_handoff_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint widget_settings_position_check check (position in ('bottom-right', 'bottom-left'))
);

comment on table public.widget_settings is 'Per-business widget configuration; one row per business.';

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.businesses
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.knowledge_items
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.widget_settings
  for each row execute function public.set_updated_at();
