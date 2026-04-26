-- Phase 17 — Postgres full-text search on deals (title, description, brand).
-- Optional env in app: set ``DEALS_SEARCH_FTS=0`` to force legacy ILIKE-only path.

alter table public.deals
  add column if not exists search_tsv tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(title, '')
        || ' '
        || coalesce(description, '')
        || ' '
        || coalesce(brand, '')
    )
  ) stored;

create index if not exists deals_search_tsv_gin_idx
  on public.deals using gin (search_tsv);

comment on column public.deals.search_tsv is
  'Weighted FTS document for websearch / ranking (Phase 17).';

-- Ranked + faceted search for anon/authenticated (RLS applies as invoker).
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
  'FTS browse for active deals; returns {total, deals} JSON (Phase 17).';

revoke all on function public.search_active_deals_fts(
  text, text, text, integer, double precision, boolean, text, integer, integer
) from public;

grant execute on function public.search_active_deals_fts(
  text, text, text, integer, double precision, boolean, text, integer, integer
) to anon, authenticated, service_role;
