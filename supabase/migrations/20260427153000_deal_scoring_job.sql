-- Phase 16 — recompute ``deals.score`` from price history + clicks, refresh ``best_deals_today``.
-- Logic mirrors ``src/lib/deals/deal-score.ts``.

create unique index if not exists best_deals_today_id_uidx
  on public.best_deals_today (id);

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
  )
  update public.deals d
     set score = s.new_score
    from scored s
   where d.id = s.id;

  refresh materialized view public.best_deals_today;
end;
$$;

comment on function public.refresh_deal_scores(interval, interval) is
  'Recomputes deals.score for active rows, then refreshes best_deals_today (mirrors computeDealScore).';

revoke all on function public.refresh_deal_scores(interval, interval) from public;
grant execute on function public.refresh_deal_scores(interval, interval) to service_role;
grant execute on function public.refresh_deal_scores(interval, interval) to postgres;

grant select on public.best_deals_today to anon, authenticated;

do $cron$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'cron') then
    if exists (select 1 from cron.job where jobname = 'dealasteal_refresh_deal_scores') then
      perform cron.unschedule((select jobid from cron.job where jobname = 'dealasteal_refresh_deal_scores' limit 1));
    end if;
    perform cron.schedule(
      'dealasteal_refresh_deal_scores',
      '*/15 * * * *',
      'select public.refresh_deal_scores()'
    );
  end if;
exception
  when others then
    raise notice 'deal scoring cron schedule skipped: %', sqlerrm;
end;
$cron$;
