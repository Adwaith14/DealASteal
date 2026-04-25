-- Baseline schema for DealASteal — captures the catalog tables (merchants,
-- deals, coupons) and their RLS posture so the migration history is
-- self-contained. ALL statements are idempotent (``IF NOT EXISTS`` /
-- ``CREATE OR REPLACE`` / ``DROP POLICY IF EXISTS``) so running this against
-- an already-populated Supabase project is a no-op.
--
-- Apply order is by filename; this file's timestamp predates the v2
-- evolution migration that follows it.

-- =========================================================================
-- merchants — affiliate networks / retailers we ingest from
-- =========================================================================
create table if not exists public.merchants (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  website_url  text,
  logo_url     text,
  description  text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists merchants_active_slug_idx
  on public.merchants (slug)
  where is_active = true;

-- =========================================================================
-- deals — the catalog
-- =========================================================================
create table if not exists public.deals (
  id                  uuid primary key default gen_random_uuid(),
  merchant_id         uuid not null references public.merchants (id) on delete restrict,
  title               text not null,
  description         text,
  original_price      double precision not null check (original_price > 0),
  discount_price      double precision not null check (discount_price > 0),
  discount_percentage integer
    generated always as (
      case when original_price > 0
           then round(((original_price - discount_price) / original_price) * 100)::int
           else 0
      end
    ) stored,
  affiliate_url       text not null,
  image_url           text,
  is_loot_deal        boolean not null default false,
  is_active           boolean not null default true,
  expires_at          timestamptz,
  created_at          timestamptz not null default now(),
  category_slug       text,
  ingest_external_id  text,
  trust_bundle        jsonb not null default '{}'::jsonb,
  constraint deals_discount_le_original check (discount_price <= original_price)
);

create index if not exists deals_active_created_idx
  on public.deals (created_at desc)
  where is_active = true;

create index if not exists deals_active_loot_idx
  on public.deals (created_at desc)
  where is_active = true and is_loot_deal = true;

create index if not exists deals_active_discount_idx
  on public.deals (discount_percentage desc)
  where is_active = true;

create index if not exists deals_active_expires_idx
  on public.deals (expires_at)
  where is_active = true and expires_at is not null;

-- =========================================================================
-- coupons — codes that link to a deal or to a merchant
-- =========================================================================
create table if not exists public.coupons (
  id              uuid primary key default gen_random_uuid(),
  merchant_id     uuid not null references public.merchants (id) on delete restrict,
  deal_id         uuid references public.deals (id) on delete set null,
  code            text not null,
  title           text not null,
  description     text,
  discount_type   text not null check (discount_type in ('percent','fixed')),
  discount_value  double precision not null check (discount_value >= 0),
  affiliate_url   text not null,
  expires_at      timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =========================================================================
-- RLS — anonymous read for the public catalog; ALL writes go through the
-- service role (server-only ingest API). No anon write policy is created.
-- =========================================================================
alter table public.merchants enable row level security;
alter table public.deals     enable row level security;
alter table public.coupons   enable row level security;

drop policy if exists "merchants_anon_read_active" on public.merchants;
create policy "merchants_anon_read_active"
  on public.merchants
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "deals_anon_read_active" on public.deals;
create policy "deals_anon_read_active"
  on public.deals
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "coupons_anon_read_active" on public.coupons;
create policy "coupons_anon_read_active"
  on public.coupons
  for select
  to anon, authenticated
  using (is_active = true);

-- updated_at touch trigger (idempotent function + per-table triggers)
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists merchants_touch_updated_at on public.merchants;
create trigger merchants_touch_updated_at
  before update on public.merchants
  for each row execute function public.touch_updated_at();

drop trigger if exists coupons_touch_updated_at on public.coupons;
create trigger coupons_touch_updated_at
  before update on public.coupons
  for each row execute function public.touch_updated_at();

comment on table public.merchants is 'Affiliate networks / retailers (Amazon, Walmart, …).';
comment on table public.deals is 'Public-facing deal catalog — anon read via RLS, writes via service role only.';
comment on table public.coupons is 'Discount codes attached to a deal or a merchant.';
