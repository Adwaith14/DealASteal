-- Phase 24 — Per-network ingest gate + compliance metadata (kill switch without deploy).

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
