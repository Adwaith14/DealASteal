-- v2 catalog evolution — fields needed for a US-launch affiliate marketplace,
-- price history (so we can prove "lowest in 90 days"), and a lightweight
-- click telemetry table that powers our "best deal" scoring.
--
-- Idempotent throughout. Run order: after baseline (20260424000000).
-- After applying, regenerate src/types/database.types.ts if you switch
-- from hand-written types to ``supabase gen types``.

-- =========================================================================
-- deals — new columns for richer affiliate metadata
-- =========================================================================
alter table public.deals
  add column if not exists currency      text not null default 'USD',
  add column if not exists merchant_sku  text,
  add column if not exists asin          text,
  add column if not exists gtin          text,
  add column if not exists brand         text,
  add column if not exists rating        double precision,
  add column if not exists rating_count  integer,
  add column if not exists availability  text,
  add column if not exists last_seen_at  timestamptz,
  add column if not exists score         double precision;

alter table public.deals drop constraint if exists deals_currency_chk;
alter table public.deals
  add constraint deals_currency_chk
  check (char_length(currency) between 3 and 3);

alter table public.deals drop constraint if exists deals_rating_chk;
alter table public.deals
  add constraint deals_rating_chk
  check (rating is null or (rating >= 0 and rating <= 5));

alter table public.deals drop constraint if exists deals_rating_count_chk;
alter table public.deals
  add constraint deals_rating_count_chk
  check (rating_count is null or rating_count >= 0);

create index if not exists deals_active_score_idx
  on public.deals (score desc nulls last)
  where is_active = true;

create index if not exists deals_active_brand_idx
  on public.deals (brand)
  where is_active = true and brand is not null;

create index if not exists deals_active_asin_idx
  on public.deals (asin)
  where is_active = true and asin is not null;

-- Trigram extension powers fast substring (ILIKE) search on title.
create extension if not exists pg_trgm;
create index if not exists deals_title_trgm_idx
  on public.deals using gin (title gin_trgm_ops)
  where is_active = true;

comment on column public.deals.currency is 'ISO-4217 currency code (3 chars). USA launch defaults to USD.';
comment on column public.deals.score is 'Aggregate "best deal" score; recomputed by background job.';

-- =========================================================================
-- price_history — append-only price snapshot per (deal_id, recorded_at)
-- =========================================================================
create table if not exists public.price_history (
  id           bigint generated always as identity primary key,
  deal_id      uuid not null references public.deals (id) on delete cascade,
  recorded_at  timestamptz not null default now(),
  price        double precision not null check (price >= 0),
  original     double precision check (original is null or original >= price),
  currency     text not null default 'USD' check (char_length(currency) = 3),
  source       text
);

create index if not exists price_history_deal_recorded_idx
  on public.price_history (deal_id, recorded_at desc);

alter table public.price_history enable row level security;

drop policy if exists "price_history_anon_read" on public.price_history;
create policy "price_history_anon_read"
  on public.price_history
  for select
  to anon, authenticated
  using (true);

comment on table public.price_history is
  'Append-only price snapshot. Used for "lowest in 90 days" badge and trend chart.';

-- Append a snapshot whenever the live price changes.
create or replace function public.deals_record_price_history()
returns trigger language plpgsql as $$
begin
  -- only on real price changes; ignore touch updates that don't move the price
  if (tg_op = 'INSERT')
     or (old.discount_price is distinct from new.discount_price)
     or (old.original_price is distinct from new.original_price) then
    insert into public.price_history (deal_id, price, original, currency, source)
    values (new.id, new.discount_price, new.original_price, coalesce(new.currency, 'USD'), 'deal_change');
  end if;
  return new;
end;
$$;

drop trigger if exists deals_record_price_history_ins on public.deals;
create trigger deals_record_price_history_ins
  after insert on public.deals
  for each row execute function public.deals_record_price_history();

drop trigger if exists deals_record_price_history_upd on public.deals;
create trigger deals_record_price_history_upd
  after update of discount_price, original_price on public.deals
  for each row execute function public.deals_record_price_history();

-- =========================================================================
-- click_events — outbound click telemetry (no PII; ip is hashed)
-- =========================================================================
create table if not exists public.click_events (
  id          bigint generated always as identity primary key,
  deal_id     uuid not null references public.deals (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  user_id     uuid references auth.users (id) on delete set null,
  ip_hash     text,
  ua_hash     text,
  referrer    text,
  country     text
);

create index if not exists click_events_deal_occurred_idx
  on public.click_events (deal_id, occurred_at desc);

create index if not exists click_events_occurred_idx
  on public.click_events (occurred_at desc);

alter table public.click_events enable row level security;
-- No anon read/write policy: only service role inserts, only product analytics
-- jobs (running with service role) read.

comment on table public.click_events is
  'Outbound affiliate click telemetry; no raw IP or UA stored.';

-- =========================================================================
-- materialised "best deal of day" view — recomputed by cron / Postgres job
-- =========================================================================
create materialized view if not exists public.best_deals_today as
  select
    d.id,
    d.title,
    d.merchant_id,
    d.discount_percentage,
    d.discount_price,
    d.original_price,
    d.score,
    d.created_at
  from public.deals d
  where d.is_active = true
    and d.discount_percentage is not null
    and d.discount_percentage >= 30
  order by coalesce(d.score, 0) desc, d.discount_percentage desc, d.created_at desc
  limit 100;

create index if not exists best_deals_today_score_idx
  on public.best_deals_today (score desc nulls last);

comment on materialized view public.best_deals_today is
  'Cached "intelligent best deals" snapshot; refresh hourly via cron.';
