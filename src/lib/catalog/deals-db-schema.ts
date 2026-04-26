/**
 * Remote Supabase may lag repo migrations. v2 columns (currency, asin, …)
 * require ``supabase/migrations/20260425000000_v2_catalog_evolution.sql``.
 *
 * Set ``DEALS_DB_V2=1`` in ``.env.local`` **after** that migration is applied
 * so reads/inserts include extended columns. When unset, we use the pre-v2
 * column set so PostgREST never asks Postgres for missing columns.
 */
export function dealsDbHasV2Schema(): boolean {
  return String(process.env.DEALS_DB_V2 ?? '').trim() === '1';
}

/** After ``20260501100000_phase23_admin_console.sql``, set ``DEALS_ADMIN_SCHEMA=1`` for admin columns + pin ordering in catalog queries. */
export function dealsDbHasAdminSchema(): boolean {
  return String(process.env.DEALS_ADMIN_SCHEMA ?? '').trim() === '1';
}

/** Columns present on every shipped deals row before v2. */
export const DEAL_SELECT_COLUMNS_CORE =
  'id, merchant_id, title, description, original_price, discount_price, discount_percentage, affiliate_url, image_url, is_loot_deal, is_active, expires_at, created_at, category_slug, ingest_external_id, trust_bundle';

const DEAL_SELECT_COLUMNS_V2_SUFFIX =
  ', currency, merchant_sku, asin, gtin, brand, rating, rating_count, availability, last_seen_at, score';

const DEAL_SELECT_ADMIN_SUFFIX = ', admin_hidden, admin_pinned_at';

/** PostgREST ``select=`` fragment for ``from('deals')`` list/detail queries. */
export function dealSelectColumnsForPostgrest(): string {
  const base = dealsDbHasV2Schema()
    ? `${DEAL_SELECT_COLUMNS_CORE}${DEAL_SELECT_COLUMNS_V2_SUFFIX}`
    : DEAL_SELECT_COLUMNS_CORE;
  return dealsDbHasAdminSchema() ? `${base}${DEAL_SELECT_ADMIN_SUFFIX}` : base;
}

const V2_INSERT_KEYS = [
  'currency',
  'merchant_sku',
  'asin',
  'gtin',
  'brand',
  'rating',
  'rating_count',
  'availability',
  'last_seen_at',
] as const;

/**
 * Strips v2-only keys before ``insert``/``upsert`` when the database has not
 * been migrated yet. Idempotent when v2 is enabled.
 */
export function stripV2DealInsertColumns<T extends Record<string, unknown>>(row: T): T {
  if (dealsDbHasV2Schema()) return row;
  const next = { ...row } as Record<string, unknown>;
  for (const k of V2_INSERT_KEYS) {
    delete next[k];
  }
  return next as T;
}
