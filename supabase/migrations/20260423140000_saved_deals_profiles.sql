-- Phase 10: per-user saved deals + JSON preferences (RLS; no service role in app).

create table if not exists public.saved_deals (
  user_id uuid not null references auth.users (id) on delete cascade,
  deal_id uuid not null references public.deals (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, deal_id)
);

create index if not exists saved_deals_user_created_idx
  on public.saved_deals (user_id, created_at desc);

alter table public.saved_deals enable row level security;

create policy "saved_deals_select_own"
  on public.saved_deals
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "saved_deals_insert_own"
  on public.saved_deals
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "saved_deals_delete_own"
  on public.saved_deals
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
