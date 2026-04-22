-- Replace partial unique index from an older 20260422150000 revision if present.
-- PostgREST needs a non-partial unique index for ``upsert`` / ``ON CONFLICT (ingest_external_id)``.

drop index if exists public.deals_ingest_external_id_uidx;

create unique index if not exists deals_ingest_external_id_uidx
  on public.deals (ingest_external_id);
