-- Link coupons to deals for homepage "Coupon Deals" (`getCouponDeals` filters on `deal_id`).
-- Safe to re-run: IF NOT EXISTS.
--
-- Apply in Supabase → SQL → New query (copy this file’s statements only), or `supabase db push`.
--

alter table public.coupons
  add column if not exists deal_id uuid references public.deals (id) on delete set null;

comment on column public.coupons.deal_id is
  'Optional FK to the deal this coupon applies to; used by DealASteal coupon sections.';

create index if not exists coupons_deal_id_active_idx
  on public.coupons (deal_id)
  where deal_id is not null and is_active = true;
