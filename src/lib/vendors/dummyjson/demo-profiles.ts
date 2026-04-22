import type { DealIngestPayload } from '@/types/schemas';
import type { DummyJsonProduct } from './types';
import { normalizeDummyJsonProduct } from './normalize-product';

export type DemoDealProfile = 'default' | 'expiring' | 'coupon' | 'top' | 'hot';

function hoursFromNowIso(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

/**
 * Builds ingest payloads so homepage sections (expiring / coupon / top / hot / latest) each have data.
 * Demo-only: price overrides for `top` are synthetic, not from the affiliate network.
 */
export function buildDemoIngestPayload(
  product: DummyJsonProduct,
  merchantId: string,
  profile: DemoDealProfile
): DealIngestPayload {
  const base = normalizeDummyJsonProduct(product, { merchantId });

  switch (profile) {
    case 'expiring':
      return {
        ...base,
        /** Within next 7 days → `getExpiringDeals` */
        expires_at: hoursFromNowIso(72),
      };
    case 'top':
      return {
        ...base,
        /** ≥40% off after insert math → `getTopDeals` strict query */
        original_price: 100,
        discount_price: 55,
        is_loot_deal: false,
      };
    case 'hot':
      return {
        ...base,
        /** `getHotDeals` uses `is_loot_deal = true` */
        is_loot_deal: true,
        original_price: 120,
        discount_price: 72,
      };
    case 'coupon':
      return base;
    case 'default':
      return base;
  }
}

/** Plan slice indices → profile for a fixed-size DummyJSON pull (0-based indices). */
export function demoProfileForIndex(index: number): DemoDealProfile {
  if (index < 8) return 'expiring';
  if (index < 12) return 'coupon';
  if (index < 18) return 'top';
  if (index < 24) return 'hot';
  return 'default';
}
