export interface Merchant {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
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
  /** Row creation time (used for ordering and pagination). */
  created_at: string;
  /** Browse facet slug (``tech``, ``laptops``, …). Nullable until backfilled or set on ingest. */
  category_slug: string | null;
  /** When set, ingest upserts on this key (e.g. ``dummyjson:123``). */
  ingest_external_id: string | null;
}

/** Deal row joined with ``merchants.name`` for display (home marketing cards). */
export type DealWithMerchantName = Deal & { merchant_name: string | null };

export type CouponDiscountType = 'percent' | 'fixed';

export interface Coupon {
  id: string;
  merchant_id: string;
  deal_id: string | null;
  code: string;
  title: string;
  description: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  affiliate_url: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
