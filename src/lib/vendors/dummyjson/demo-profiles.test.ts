import { describe, expect, it } from 'vitest';
import { DealIngestSchema } from '@/types/schemas';
import { buildDemoIngestPayload, demoProfileForIndex } from './demo-profiles';
import type { DummyJsonProduct } from './types';

const MERCHANT = '550e8400-e29b-41d4-a716-446655440000';

const product = (id: number): DummyJsonProduct => ({
  id,
  title: `Product ${id}`,
  description: 'Desc',
  category: 'beauty',
  price: 20,
  discountPercentage: 15,
  thumbnail: 'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp',
});

describe('demoProfileForIndex', () => {
  it('maps ranges to profiles', () => {
    expect(demoProfileForIndex(0)).toBe('expiring');
    expect(demoProfileForIndex(7)).toBe('expiring');
    expect(demoProfileForIndex(8)).toBe('coupon');
    expect(demoProfileForIndex(11)).toBe('coupon');
    expect(demoProfileForIndex(12)).toBe('top');
    expect(demoProfileForIndex(17)).toBe('top');
    expect(demoProfileForIndex(18)).toBe('hot');
    expect(demoProfileForIndex(23)).toBe('hot');
    expect(demoProfileForIndex(24)).toBe('default');
  });
});

describe('buildDemoIngestPayload', () => {
  it('expiring passes schema and sets expires_at', () => {
    const p = buildDemoIngestPayload(product(1), MERCHANT, 'expiring');
    const r = DealIngestSchema.safeParse(p);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.expires_at).toBeDefined();
    expect(Date.parse(r.data.expires_at!)).toBeGreaterThan(Date.now());
  });

  it('top yields >= 40% discount after insert math', () => {
    const p = buildDemoIngestPayload(product(2), MERCHANT, 'top');
    const r = DealIngestSchema.safeParse(p);
    expect(r.success).toBe(true);
    if (!r.success) return;
    const pct = Math.round(
      ((r.data.original_price - r.data.discount_price) / r.data.original_price) * 100
    );
    expect(pct).toBeGreaterThanOrEqual(40);
  });

  it('hot sets is_loot_deal', () => {
    const p = buildDemoIngestPayload(product(3), MERCHANT, 'hot');
    expect(p.is_loot_deal).toBe(true);
    expect(DealIngestSchema.safeParse(p).success).toBe(true);
  });
});
