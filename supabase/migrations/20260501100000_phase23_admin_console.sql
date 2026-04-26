-- Phase 23 — Admin console: role-gated curation, audit trail, ingest status rows.

-- ---------------------------------------------------------------------------
-- profiles.role — only service_role may change role (trigger).
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin'));

comment on column public.profiles.role is
  'Access tier; admin unlocks /admin and deals admin RLS policies. Set via service role only.';

create or replace function public.profiles_enforce_role_service_only()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(auth.role(), '') <> 'service_role' then
      new.role := 'user';
    end if;
    return new;
  end if;
  if new.role is distinct from old.role and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'profiles.role may only be changed by service role' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_enforce_role_trg on public.profiles;
create trigger profiles_enforce_role_trg
  before insert or update on public.profiles
  for each row execute function public.profiles_enforce_role_service_only();

-- ---------------------------------------------------------------------------
-- deals — admin curation flags (anon reads exclude admin_hidden).
-- ---------------------------------------------------------------------------
alter table public.deals
  add column if not exists admin_hidden boolean not null default false;

alter table public.deals
  add column if not exists admin_pinned_at timestamptz null;

comment on column public.deals.admin_hidden is
  'When true, deal is excluded from public catalog (RLS) but remains for operators.';

comment on column public.deals.admin_pinned_at is
  'Non-null means pinned; public lists order pinned first (newest pin wins).';

create index if not exists deals_admin_pinned_idx
  on public.deals (admin_pinned_at desc nulls last)
  where is_active = true and admin_hidden = false;

-- ---------------------------------------------------------------------------
-- Helper: current JWT is an admin profile (stable; used in RLS).
-- ---------------------------------------------------------------------------
create or replace function public.is_profile_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

comment on function public.is_profile_admin() is
  'True when auth.uid() has profiles.role = admin (definer reads profiles).';

revoke all on function public.is_profile_admin() from public;
grant execute on function public.is_profile_admin() to anon, authenticated, service_role;

-- Replace public read: active + not admin-hidden
drop policy if exists "deals_anon_read_active" on public.deals;
create policy "deals_anon_read_active"
  on public.deals
  for select
  to anon, authenticated
  using (is_active = true and admin_hidden = false);

drop policy if exists "deals_admin_select_all" on public.deals;
create policy "deals_admin_select_all"
  on public.deals
  for select
  to authenticated
  using (public.is_profile_admin());

drop policy if exists "deals_admin_update" on public.deals;
create policy "deals_admin_update"
  on public.deals
  for update
  to authenticated
  using (public.is_profile_admin())
  with check (public.is_profile_admin());

-- ---------------------------------------------------------------------------
-- admin_actions — append-only audit (admins insert + select own org-wide).
-- ---------------------------------------------------------------------------
create table if not exists public.admin_actions (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid not null references auth.users (id) on delete restrict,
  action      text not null,
  entity_type text not null default 'deal',
  entity_id   uuid,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists admin_actions_created_idx
  on public.admin_actions (created_at desc);

alter table public.admin_actions enable row level security;

drop policy if exists "admin_actions_select_admins" on public.admin_actions;
create policy "admin_actions_select_admins"
  on public.admin_actions
  for select
  to authenticated
  using (public.is_profile_admin());

drop policy if exists "admin_actions_insert_self" on public.admin_actions;
create policy "admin_actions_insert_self"
  on public.admin_actions
  for insert
  to authenticated
  with check (
    public.is_profile_admin()
    and actor_id = (select auth.uid())
  );

comment on table public.admin_actions is
  'Operator audit log; inserts use authenticated admin JWT.';

-- ---------------------------------------------------------------------------
-- ingest_network_status — last worker heartbeat per network (service + admins).
-- ---------------------------------------------------------------------------
create table if not exists public.ingest_network_status (
  network          text primary key,
  last_started_at  timestamptz,
  last_finished_at timestamptz,
  last_ok          boolean,
  last_error       text,
  last_rows        integer,
  updated_at       timestamptz not null default now()
);

alter table public.ingest_network_status enable row level security;

drop policy if exists "ingest_network_status_select_admins" on public.ingest_network_status;
create policy "ingest_network_status_select_admins"
  on public.ingest_network_status
  for select
  to authenticated
  using (public.is_profile_admin());

-- Writes from app workers use service role (bypass RLS) or future ingest route.

comment on table public.ingest_network_status is
  'Per-network ingest health; updated by workers via service role / ingest API.';

-- ---------------------------------------------------------------------------
-- FTS + scoring: exclude admin-hidden deals from public search + MV inputs.
-- ---------------------------------------------------------------------------
create or replace function public.search_active_deals_fts(
  p_q text,
  p_category_slug text default null,
  p_affiliate_url_pattern text default null,
  p_min_discount integer default null,
  p_max_price double precision default null,
  p_loot_only boolean default false,
  p_sort text default 'relevance',
  p_limit integer default 24,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  tsq tsquery;
  v_sort text := lower(trim(coalesce(p_sort, 'relevance')));
begin
  if length(trim(coalesce(p_q, ''))) < 2 then
    return jsonb_build_object('total', 0::bigint, 'deals', '[]'::jsonb);
  end if;

  tsq := websearch_to_tsquery('english', trim(p_q));

  if tsq is null or tsq = ''::tsquery then
    return jsonb_build_object('total', 0::bigint, 'deals', '[]'::jsonb);
  end if;

  return (
    with filt as (
      select
        d.*,
        ts_rank_cd(d.search_tsv, tsq) as _rank
      from public.deals d
      where d.is_active = true
        and coalesce(d.admin_hidden, false) = false
        and d.search_tsv @@ tsq
        and (
          p_category_slug is null
          or length(trim(p_category_slug)) = 0
          or d.category_slug = p_category_slug
        )
        and (
          p_affiliate_url_pattern is null
          or length(trim(p_affiliate_url_pattern)) = 0
          or d.affiliate_url ilike p_affiliate_url_pattern
        )
        and (p_min_discount is null or d.discount_percentage >= p_min_discount)
        and (p_max_price is null or d.discount_price <= p_max_price)
        and (not p_loot_only or d.is_loot_deal = true)
    ),
    tot as (
      select count(*)::bigint as c from filt
    ),
    ordered as (
      select *
      from filt
      order by
        coalesce(admin_pinned_at, '-infinity'::timestamptz) desc,
        case when v_sort = 'newest' then created_at end desc nulls last,
        case when v_sort in ('relevance', '') then _rank end desc nulls last,
        case when v_sort = 'discount_desc' then discount_percentage end desc nulls last,
        case when v_sort = 'price_asc' then discount_price end asc nulls last,
        case when v_sort = 'price_desc' then discount_price end desc nulls last,
        created_at desc
    ),
    paged as (
      select
        o.*,
        row_number() over (
          order by
            coalesce(o.admin_pinned_at, '-infinity'::timestamptz) desc,
            case when v_sort = 'newest' then o.created_at end desc nulls last,
            case when v_sort in ('relevance', '') then o._rank end desc nulls last,
            case when v_sort = 'discount_desc' then o.discount_percentage end desc nulls last,
            case when v_sort = 'price_asc' then o.discount_price end asc nulls last,
            case when v_sort = 'price_desc' then o.discount_price end desc nulls last,
            o.created_at desc
        ) as _seq
      from ordered o
      limit greatest(1, least(p_limit, 96))
      offset greatest(0, p_offset)
    )
    select jsonb_build_object(
      'total', (select c from tot),
      'deals', (
        select coalesce(
          jsonb_agg(
            (to_jsonb(p) - 'search_tsv' - '_rank' - '_seq')
            order by p._seq
          ),
          '[]'::jsonb
        )
        from paged p
      )
    )
  );
end;
$$;

comment on function public.search_active_deals_fts is
  'FTS browse for active non-hidden deals; returns {total, deals} JSON.';

revoke all on function public.search_active_deals_fts(
  text, text, text, integer, double precision, boolean, text, integer, integer
) from public;

grant execute on function public.search_active_deals_fts(
  text, text, text, integer, double precision, boolean, text, integer, integer
) to anon, authenticated, service_role;

-- Materialised view: exclude admin-hidden deals from public “best” snapshot.
drop materialized view if exists public.best_deals_today;
create materialized view public.best_deals_today as
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
    and coalesce(d.admin_hidden, false) = false
    and d.discount_percentage is not null
    and d.discount_percentage >= 30
  order by coalesce(d.score, 0) desc, d.discount_percentage desc, d.created_at desc
  limit 100;

create unique index if not exists best_deals_today_id_uidx
  on public.best_deals_today (id);

create index if not exists best_deals_today_score_idx
  on public.best_deals_today (score desc nulls last);

grant select on public.best_deals_today to anon, authenticated;

-- refresh_deal_scores: skip admin-hidden rows in score recompute; then REFRESH MV.
create or replace function public.refresh_deal_scores(
  p_history_window interval default interval '30 days',
  p_clicks_window interval default interval '7 days'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with lows as (
    select ph.deal_id,
           min(ph.price)::double precision as min_price
      from public.price_history ph
     where ph.recorded_at >= (now() - p_history_window)
     group by ph.deal_id
  ),
  clk as (
    select ce.deal_id,
           count(*)::bigint as cnt
      from public.click_events ce
     where ce.occurred_at >= (now() - p_clicks_window)
     group by ce.deal_id
  ),
  scored as (
    select
      d.id,
      round(
        least(
          greatest(
            (
              (least(greatest(coalesce(d.discount_percentage, 0), 0), 90) / 90.0) * 40.0
              + case
                  when l.min_price is null or l.min_price <= 0 then 10.0
                  when d.discount_price <= l.min_price then 20.0
                  else least(
                    greatest(
                      (l.min_price / nullif(d.discount_price, 0)) * 20.0,
                      0.0
                    ),
                    20.0
                  )
                end
              + least(
                  greatest(
                    (coalesce(d.rating, 0) / 5.0) * 12.0
                    + case
                        when coalesce(d.rating_count, 0) >= 250 then 3.0
                        when coalesce(d.rating_count, 0) >= 25 then 2.0
                        when coalesce(d.rating_count, 0) >= 5 then 1.0
                        else 0.0
                      end,
                    0.0
                  ),
                  15.0
                )
              + least(
                  greatest(log(1::numeric + coalesce(c.cnt, 0)::numeric) * 5.0, 0.0),
                  10.0
                )
              + case
                  when d.created_at is null then 0.0
                  when d.created_at > now() then 0.0
                  else least(
                    greatest(
                      10.0 * power(
                        0.5::numeric,
                        (extract(epoch from (now() - d.created_at::timestamptz)) / 3600.0 / 96.0)::numeric
                      ),
                      0.0
                    ),
                    10.0
                  )
                end
              + case
                  when d.expires_at is not null
                   and extract(epoch from (d.expires_at::timestamptz - now())) / 3600.0 > 0
                   and extract(epoch from (d.expires_at::timestamptz - now())) / 3600.0 < 24
                  then 5.0
                  when coalesce(d.is_loot_deal, false) then 3.0
                  else 0.0
                end
            )
            * case
                when coalesce(lower(d.availability), '') ~ '(out_of_stock|out-of-stock|unavailable|sold\\s*out)'
                  then 0.25
                else 1.0
              end,
            0.0
          ),
          100.0
        )::numeric,
        2
      )::double precision as new_score
    from public.deals d
    left join lows l on l.deal_id = d.id
    left join clk c on c.deal_id = d.id
   where d.is_active = true
     and coalesce(d.admin_hidden, false) = false
  )
  update public.deals d
     set score = s.new_score
    from scored s
   where d.id = s.id;

  refresh materialized view public.best_deals_today;
end;
$$;

comment on function public.refresh_deal_scores(interval, interval) is
  'Recomputes deals.score for active non-hidden rows, then refreshes best_deals_today.';

revoke all on function public.refresh_deal_scores(interval, interval) from public;
grant execute on function public.refresh_deal_scores(interval, interval) to service_role;
grant execute on function public.refresh_deal_scores(interval, interval) to postgres;
