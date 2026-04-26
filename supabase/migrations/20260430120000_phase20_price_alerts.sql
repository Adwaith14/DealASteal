-- Phase 20 — price drop email alerts (owner-scoped, Resend, HMAC unsubscribe).

create table if not exists public.price_alerts (
  id                 uuid not null default gen_random_uuid() primary key,
  user_id            uuid not null references auth.users (id) on delete cascade,
  deal_id            uuid not null references public.deals (id) on delete cascade,
  threshold_price    double precision not null check (threshold_price > 0),
  currency           text not null default 'USD',
  notify_email       text not null,
  is_active          boolean not null default true,
  is_below_threshold boolean not null default false,
  last_fired_at      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create unique index if not exists price_alerts_user_deal_uniq
  on public.price_alerts (user_id, deal_id);

create index if not exists price_alerts_active_deal_idx
  on public.price_alerts (is_active, deal_id)
  where is_active = true;

comment on table public.price_alerts is
  'User price-drop alerts. Cron compares current price (deals + price_history) to threshold; is_below_threshold tracks crossing.';

drop trigger if exists price_alerts_touch_updated_at on public.price_alerts;
create trigger price_alerts_touch_updated_at
  before update on public.price_alerts
  for each row execute function public.touch_updated_at();

alter table public.price_alerts enable row level security;

drop policy if exists "price_alerts_select_own" on public.price_alerts;
create policy "price_alerts_select_own"
  on public.price_alerts
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "price_alerts_insert_own" on public.price_alerts;
create policy "price_alerts_insert_own"
  on public.price_alerts
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "price_alerts_update_own" on public.price_alerts;
create policy "price_alerts_update_own"
  on public.price_alerts
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "price_alerts_delete_own" on public.price_alerts;
create policy "price_alerts_delete_own"
  on public.price_alerts
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
