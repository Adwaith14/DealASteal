const CATEGORY_SLUG_MIGRATION_FILE =
  'supabase/migrations/20260415190000_add_category_slug_to_deals.sql';

const INGEST_EXTERNAL_ID_MIGRATION_FILE =
  'supabase/migrations/20260422150000_deals_ingest_external_id.sql';

function isMissingCategorySlugColumn(error: {
  message?: string | null;
  code?: string | null;
}): boolean {
  const msg = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return error.code === '42703' && msg.includes('category_slug');
}

function isMissingIngestExternalIdColumn(error: {
  message?: string | null;
  code?: string | null;
}): boolean {
  const msg = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return error.code === '42703' && msg.includes('ingest_external_id');
}

/** Maps PostgREST / Postgres errors to copy you can show in the UI or logs. */
export function mapDealsPostgrestError(
  fallback: string,
  error: { message?: string | null; code?: string | null }
): string {
  if (isMissingCategorySlugColumn(error)) {
    return (
      `Your database is missing column deals.category_slug (Postgres ${error.code}). ` +
      `Open Supabase → SQL Editor, paste and run ${CATEGORY_SLUG_MIGRATION_FILE}, then reload. ` +
      `Alternatively run: supabase db push`
    );
  }
  if (isMissingIngestExternalIdColumn(error)) {
    return (
      `Your database is missing column deals.ingest_external_id (Postgres ${error.code}). ` +
      `Open Supabase → SQL Editor, paste and run ${INGEST_EXTERNAL_ID_MIGRATION_FILE}, then reload.`
    );
  }
  const m = typeof error.message === 'string' && error.message.trim().length > 0;
  return m ? String(error.message) : fallback;
}
