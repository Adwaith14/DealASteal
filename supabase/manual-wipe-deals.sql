-- Manual wipe: run in Supabase → SQL → New query.
-- Deletes coupon rows first (they may reference deals), then all deals.
-- Adjust table names if your schema differs.
--
-- Before re-seeding from the repo script, ensure coupons schema matches the app:
--   supabase/migrations/20260422140000_align_coupons_for_dealasteal.sql
--

begin;

delete from public.coupons;

delete from public.deals;

commit;

-- Optional: reset sequences if you use serial ids (UUID deals usually skip this)
-- alter sequence ... restart;
