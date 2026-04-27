-- Optional: restrict category_slug to values the app + ingest allow (nullable allowed).
-- Runs only when the column exists and the constraint is not already present.
--
-- Paste the SQL below into Supabase SQL Editor (not the filepath). Or use: npm run db:supabase-sql

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'deals'
      and column_name = 'category_slug'
  ) and not exists (
    select 1
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'deals'
      and c.conname = 'deals_category_slug_allowed'
  ) then
    alter table public.deals
      add constraint deals_category_slug_allowed
      check (
        category_slug is null
        or category_slug in ('tech', 'laptops', 'fashion', 'home')
      );
  end if;
end $$;
