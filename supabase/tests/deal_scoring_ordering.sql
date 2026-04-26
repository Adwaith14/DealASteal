-- Ordering check for ``public.refresh_deal_scores`` (Phase 16).
-- Run against a dev database (not production):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/deal_scoring_ordering.sql
--
-- Expect: deal ``caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1`` ends with a higher ``score`` than
-- ``caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2`` after refresh (deeper discount + stronger rating).

begin;

delete from public.price_history
 where deal_id in (
   select id from public.deals where merchant_id = 'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
 );
delete from public.click_events
 where deal_id in (
   select id from public.deals where merchant_id = 'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
 );
delete from public.deals where merchant_id = 'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
delete from public.merchants where id = 'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';

insert into public.merchants (id, name, slug)
values ('baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'ScoreTest', 'zzz-scoretest-merchant');

insert into public.deals (
  id,
  merchant_id,
  title,
  description,
  original_price,
  discount_price,
  affiliate_url,
  is_loot_deal,
  is_active,
  created_at,
  rating,
  rating_count,
  availability
)
values
  (
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'Deep discount hero',
    null,
    100,
    40,
    'https://example.com/a',
    true,
    true,
    now() - interval '1 day',
    5,
    200,
    'in_stock'
  ),
  (
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'Mild discount',
    null,
    100,
    85,
    'https://example.com/b',
    false,
    true,
    now() - interval '2 days',
    3,
    2,
    'in_stock'
  );

insert into public.price_history (deal_id, recorded_at, price, original, currency, source)
values
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', now() - interval '5 days', 45, 100, 'USD', 'test'),
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', now() - interval '5 days', 86, 100, 'USD', 'test');

insert into public.click_events (deal_id, occurred_at)
select 'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', now() - interval '1 day'
from generate_series(1, 50) as _;

select public.refresh_deal_scores();

do $assert$
declare
  s1 double precision;
  s2 double precision;
begin
  select score into s1 from public.deals where id = 'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  select score into s2 from public.deals where id = 'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
  if s1 is null or s2 is null then
    raise exception 'expected both deals to have score after refresh';
  end if;
  if s1 <= s2 then
    raise exception 'expected deal1 score % to beat deal2 score %', s1, s2;
  end if;
end;
$assert$;

rollback;
