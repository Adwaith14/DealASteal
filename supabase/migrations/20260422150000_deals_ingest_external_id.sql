-- Idempotent ingest: one stable key per upstream offer (e.g. dummyjson:42).
-- Apply in Supabase → SQL. Safe to re-run.

alter table public.deals
  add column if not exists ingest_external_id text;

comment on column public.deals.ingest_external_id is
  'Optional stable key from the feed (format: provider:upstreamId). Used for upsert / dedupe on ingest.';

-- Full (non-partial) unique index so PostgREST upsert ``ON CONFLICT (ingest_external_id)``
-- matches; partial indexes are not inferred for that. Multiple NULLs are still allowed.
create unique index if not exists deals_ingest_external_id_uidx
  on public.deals (ingest_external_id);
