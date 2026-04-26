import type { DealTrustBundle } from '@/types/schemas';

export type { DealTrustBundle };

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

export type DealAvailability =
  | 'in_stock'
  | 'out_of_stock'
  | 'preorder'
  | 'limited'
  | 'unknown'
  | string;

export interface Deal {
  id: string;
  merchant_id: string;
  title: string;
  description: string | null;
  original_price: number;
  discount_price: number;
  /** Computed on the database via generated column. Read-only from the app. */
  discount_percentage: number;
  affiliate_url: string;
  image_url: string | null;
  is_loot_deal: boolean;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  category_slug: string | null;
  ingest_external_id: string | null;
  trust_bundle?: DealTrustBundle | null;
  // ── v2 catalog evolution ────────────────────────────────────────────────
  /** ISO-4217 currency code (3 letters). Defaults to ``USD``. */
  currency?: string;
  /** Vendor-side stock keeping unit. */
  merchant_sku?: string | null;
  /** Amazon Standard Identification Number. */
  asin?: string | null;
  /** Global Trade Item Number (UPC/EAN). */
  gtin?: string | null;
  brand?: string | null;
  /** Average rating, 0–5. */
  rating?: number | null;
  rating_count?: number | null;
  availability?: DealAvailability | null;
  /** Last time we re-verified the deal at the source. */
  last_seen_at?: string | null;
  /** Aggregate "best deal" score; populated by the scorer job. */
  score?: number | null;
  /** Phase 23 — hidden from public catalog (RLS); optional until ``DEALS_ADMIN_SCHEMA=1`` selects. */
  admin_hidden?: boolean;
  /** Phase 23 — non-null when pinned for homepage ordering. */
  admin_pinned_at?: string | null;
}

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

/** ``public.profiles`` — per-user JSON preferences (Phase 10). */
export type ProfileRole = 'user' | 'admin';

export interface Profile {
  id: string;
  preferences: Record<string, unknown>;
  updated_at: string;
  role?: ProfileRole;
}

/** ``public.saved_deals`` composite row (Phase 10). */
export interface SavedDeal {
  user_id: string;
  deal_id: string;
  created_at: string;
}

/** ``public.price_history`` — append-only snapshot used for "lowest in N days". */
export interface PriceHistoryRow {
  id: number;
  deal_id: string;
  recorded_at: string;
  price: number;
  original: number | null;
  currency: string;
  source: string | null;
}

/** ``public.price_alerts`` — email when deal price crosses at or below threshold (Phase 20). */
export interface PriceAlert {
  id: string;
  user_id: string;
  deal_id: string;
  threshold_price: number;
  currency: string;
  notify_email: string;
  is_active: boolean;
  is_below_threshold: boolean;
  last_fired_at: string | null;
  created_at: string;
  updated_at: string;
}

/** ``public.click_events`` — outbound affiliate click telemetry. */
export interface ClickEvent {
  id: number;
  deal_id: string;
  occurred_at: string;
  user_id: string | null;
  ip_hash: string | null;
  ua_hash: string | null;
  referrer: string | null;
  country: string | null;
}
