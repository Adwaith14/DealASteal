-- One-shot sync: Phase 24 (ingest_network_settings) + Phase 25 (push_subscriptions).
-- Safe to re-run. Wrap silences benign ``DROP IF EXISTS`` notices.
-- Run in Supabase SQL Editor (or psql) as a privileged role.

begin;

set local client_min_messages = error;

-- --- Phase 24 (from 20260502120000_phase24_multi_network.sql) ---

create table if not exists public.ingest_network_settings (
  network_slug      text primary key,
  ingest_enabled    boolean not null default true,
  tos_url           text,
  disclosure_note   text,
  attribution_note  text,
  updated_at        timestamptz not null default now()
);

comment on table public.ingest_network_settings is
  'Operator toggles + compliance copy; workers read via GET /api/ingest/network-config.';

insert into public.ingest_network_settings (network_slug, ingest_enabled)
values
  ('amazon', true),
  ('walmart', true),
  ('ebay', true),
  ('bestbuy', true),
  ('target', true)
on conflict (network_slug) do nothing;

alter table public.ingest_network_settings enable row level security;

drop policy if exists "ingest_network_settings_admin_select" on public.ingest_network_settings;
create policy "ingest_network_settings_admin_select"
  on public.ingest_network_settings
  for select
  to authenticated
  using (public.is_profile_admin());

drop policy if exists "ingest_network_settings_admin_update" on public.ingest_network_settings;
create policy "ingest_network_settings_admin_update"
  on public.ingest_network_settings
  for update
  to authenticated
  using (public.is_profile_admin())
  with check (public.is_profile_admin());

-- --- Phase 25 (from 20260527120000_phase25_push_subscriptions.sql) ---

create table if not exists public.push_subscriptions (
  id          uuid not null default gen_random_uuid() primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists push_subscriptions_user_endpoint_uniq
  on public.push_subscriptions (user_id, endpoint);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

comment on table public.push_subscriptions is
  'Browser Web Push subscriptions; used by cron after Resend price-drop email.';

drop trigger if exists push_subscriptions_touch_updated_at on public.push_subscriptions;
create trigger push_subscriptions_touch_updated_at
  before update on public.push_subscriptions
  for each row execute function public.touch_updated_at();

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
  on public.push_subscriptions
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

commit;
