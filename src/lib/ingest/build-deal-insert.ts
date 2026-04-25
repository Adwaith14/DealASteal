import { dealSelectColumnsForPostgrest } from '@/lib/catalog/deals-db-schema';
import type { DealIngestPayload, DealTrustBundle } from '@/types/schemas';

/** PostgREST select fragment; respects ``DEALS_DB_V2`` (see ``deals-db-schema.ts``). */
export function dealRowSelectForIngestResponse(): string {
  return dealSelectColumnsForPostgrest();
}

export type DealInsertRow = {
  merchant_id: string;
  title: string;
  description: string | null;
  original_price: number;
  discount_price: number;
  /**
   * Computed by the database via a generated column. We intentionally include
   * it here so the route can ``Object.destructure`` it off before insert,
   * preserving the historical contract while keeping the type explicit.
   */
  discount_percentage: number;
  affiliate_url: string;
  image_url: string | null;
  is_loot_deal: boolean;
  is_active: boolean;
  expires_at: string | null;
  category_slug: string | null;
  ingest_external_id: string | null;
  trust_bundle: DealTrustBundle;
  currency: string;
  merchant_sku: string | null;
  asin: string | null;
  gtin: string | null;
  brand: string | null;
  rating: number | null;
  rating_count: number | null;
  availability: string | null;
  last_seen_at: string | null;
};

export function buildDealInsertRow(payload: DealIngestPayload): DealInsertRow {
  // Kept for back-compat with callers that rely on the row shape; the DB
  // ignores this column on insert (it's a generated stored column there).
  const discount_percentage = payload.original_price > 0
    ? Math.round(
        ((payload.original_price - payload.discount_price) /
          payload.original_price) *
          100
      )
    : 0;

  return {
    merchant_id: payload.merchant_id,
    title: payload.title,
    description: payload.description ?? null,
    original_price: payload.original_price,
    discount_price: payload.discount_price,
    discount_percentage,
    affiliate_url: payload.affiliate_url,
    image_url: payload.image_url ?? null,
    is_loot_deal: payload.is_loot_deal,
    is_active: true,
    expires_at: payload.expires_at ?? null,
    category_slug: payload.category_slug ?? null,
    ingest_external_id: payload.ingest_external_id?.trim() ?? null,
    trust_bundle: payload.trust_bundle ?? {},
    currency: payload.currency ?? 'USD',
    merchant_sku: payload.merchant_sku ?? null,
    asin: payload.asin ?? null,
    gtin: payload.gtin ?? null,
    brand: payload.brand ?? null,
    rating: payload.rating ?? null,
    rating_count: payload.rating_count ?? null,
    availability: payload.availability ?? null,
    last_seen_at: payload.last_seen_at ?? null,
  };
}
