const CATEGORY_SLUG_MIGRATION_FILE =
  'supabase/migrations/20260415190000_add_category_slug_to_deals.sql';

const INGEST_EXTERNAL_ID_MIGRATION_FILE =
  'supabase/migrations/20260422150000_deals_ingest_external_id.sql';

const TRUST_BUNDLE_MIGRATION_FILE = 'supabase/migrations/20260423103000_deals_trust_bundle.sql';

const V2_CATALOG_MIGRATION_FILE = 'supabase/migrations/20260425000000_v2_catalog_evolution.sql';

/** Avoids false positives (e.g. ``rating`` matching ``rating_count``). */
const MISSING_V2_DEALS_COLUMN_RE =
  /\bcolumn\s+(deals|deals_\d+)\.(currency|merchant_sku|asin|gtin|brand|rating|rating_count|availability|last_seen_at|score)\s+does\s+not\s+exist/i;

function isMissingV2DealsCatalogColumn(error: {
  message?: string | null;
  code?: string | null;
}): boolean {
  if (error.code !== '42703') return false;
  const msg = typeof error.message === 'string' ? error.message : '';
  return MISSING_V2_DEALS_COLUMN_RE.test(msg);
}

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

function isMissingTrustBundleColumn(error: {
  message?: string | null;
  code?: string | null;
}): boolean {
  const msg = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return error.code === '42703' && msg.includes('trust_bundle');
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
  if (isMissingTrustBundleColumn(error)) {
    return (
      `Your database is missing column deals.trust_bundle (Postgres ${error.code}). ` +
      `Open Supabase → SQL Editor, paste and run ${TRUST_BUNDLE_MIGRATION_FILE}, then reload.`
    );
  }
  if (isMissingV2DealsCatalogColumn(error)) {
    return (
      `Your database is missing v2 catalog columns on deals (Postgres ${error.code}). ` +
      `Run ${V2_CATALOG_MIGRATION_FILE} in Supabase SQL Editor, then set DEALS_DB_V2=1 in .env.local and restart Next.js. ` +
      `Until then the app runs in legacy mode (no currency/asin/score columns on reads or inserts).`
    );
  }
  const m = typeof error.message === 'string' && error.message.trim().length > 0;
  return m ? String(error.message) : fallback;
}
