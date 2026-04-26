-- Phase 18 — coupons ingest + usage telemetry.

-- Hide expired coupons via RLS policy (not application filtering).
drop policy if exists "coupons_anon_read_active" on public.coupons;
create policy "coupons_anon_read_active"
  on public.coupons
  for select
  to anon, authenticated
  using (
    is_active = true
    and (expires_at is null or expires_at > now())
  );

-- Copy-and-go telemetry for coupon usage.
create table if not exists public.coupon_use_events (
  id          bigint generated always as identity primary key,
  coupon_id   uuid not null references public.coupons (id) on delete cascade,
  deal_id     uuid not null references public.deals (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  user_id     uuid references auth.users (id) on delete set null,
  ip_hash     text,
  ua_hash     text,
  referrer    text,
  country     text
);

create index if not exists coupon_use_events_coupon_occurred_idx
  on public.coupon_use_events (coupon_id, occurred_at desc);

create index if not exists coupon_use_events_deal_occurred_idx
  on public.coupon_use_events (deal_id, occurred_at desc);

alter table public.coupon_use_events enable row level security;
comment on table public.coupon_use_events is
  'Coupon copy/use telemetry from PDP copy-and-go flow (no raw IP/UA).';
