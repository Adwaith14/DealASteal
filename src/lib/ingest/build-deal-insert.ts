import type { DealIngestPayload } from '@/types/schemas';

export const DEAL_ROW_SELECT =
  'id, merchant_id, title, description, original_price, discount_price, discount_percentage, affiliate_url, image_url, is_loot_deal, is_active, expires_at, category_slug, ingest_external_id' as const;

export type DealInsertRow = {
  merchant_id: string;
  title: string;
  description: string | null;
  original_price: number;
  discount_price: number;
  discount_percentage: number;
  affiliate_url: string;
  image_url: string | null;
  is_loot_deal: boolean;
  is_active: boolean;
  expires_at: string | null;
  category_slug: string | null;
  ingest_external_id: string | null;
};

export function buildDealInsertRow(payload: DealIngestPayload): DealInsertRow {
  const discount_percentage = Math.round(
    ((payload.original_price - payload.discount_price) /
      payload.original_price) *
      100
  );

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
  };
}
