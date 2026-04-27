-- Deal browse facets (Phase 4). Safe to re-run: uses IF NOT EXISTS.
--
-- HOW TO APPLY (hosted Supabase):
--   • WRONG: typing or pasting  supabase/migrations/20260415190000_...sql  into the SQL editor
--     (that is a filepath, not SQL — you will get ERROR 42601 syntax error).
--   • RIGHT: open this file in your editor, copy ALL lines below (starting at "alter table"),
--     paste into Supabase → SQL → New query → Run.
--   • Or run locally:  npm run db:supabase-sql   then copy the printed SQL from the terminal.
--   • Or (CLI linked project):  supabase db push
--

alter table public.deals
  add column if not exists category_slug text;

comment on column public.deals.category_slug is
  'Browse facet slug (e.g. tech, laptops). Nullable until backfilled or set on ingest.';

create index if not exists deals_category_slug_active_idx
  on public.deals (category_slug)
  where is_active = true;
