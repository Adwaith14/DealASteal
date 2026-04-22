-- Align `public.coupons` with what DealASteal expects (TS `Coupon`, `getCouponDeals`, seed script).
-- Run once in Supabase → SQL (full file). Safe to re-run: uses IF NOT EXISTS on columns.
--
-- Code references:
--   • src/services/api/deals-sections.ts  → select code, discount_type, discount_value; filter deal_id, is_active; order created_at
--   • scripts/reset-and-seed-demo-deals.ts → insert id, merchant_id, deal_id, code, title, description,
--       discount_type, discount_value, affiliate_url, expires_at, is_active
--

-- FK to deals (may already exist from 20260422120000)
alter table public.coupons
  add column if not exists deal_id uuid references public.deals (id) on delete set null;

alter table public.coupons
  add column if not exists merchant_id uuid references public.merchants (id) on delete restrict;

alter table public.coupons
  add column if not exists code text;

alter table public.coupons
  add column if not exists title text;

alter table public.coupons
  add column if not exists description text;

alter table public.coupons
  add column if not exists discount_type text;

alter table public.coupons
  add column if not exists discount_value double precision;

alter table public.coupons
  add column if not exists affiliate_url text;

alter table public.coupons
  add column if not exists expires_at timestamptz;

alter table public.coupons
  add column if not exists is_active boolean not null default true;

alter table public.coupons
  add column if not exists created_at timestamptz not null default now();

alter table public.coupons
  add column if not exists updated_at timestamptz not null default now();

comment on column public.coupons.deal_id is 'FK to deal; Coupon Deals section requires non-null active rows.';
comment on column public.coupons.discount_type is 'Application expects percent | fixed (see CouponDiscountType).';
comment on column public.coupons.discount_value is 'Percent 0–100 or fixed currency amount depending on discount_type.';

-- Recreate partial index if an older migration created it before `is_active` existed.
drop index if exists public.coupons_deal_id_active_idx;

create index if not exists coupons_deal_id_active_idx
  on public.coupons (deal_id)
  where deal_id is not null and is_active = true;

create index if not exists coupons_merchant_active_idx
  on public.coupons (merchant_id)
  where is_active = true;
