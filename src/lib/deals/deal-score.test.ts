import { describe, expect, it } from 'vitest';
import type { Deal } from '@/types/database.types';
import { computeDealScore, isHeadlineDeal } from './deal-score';

type DealScoreSlice = Pick<
  Deal,
  | 'discount_percentage'
  | 'discount_price'
  | 'original_price'
  | 'is_loot_deal'
  | 'rating'
  | 'rating_count'
  | 'availability'
  | 'expires_at'
  | 'created_at'
>;

function makeDeal(overrides: Partial<DealScoreSlice> = {}): DealScoreSlice {
  return {
    discount_percentage: 30,
    discount_price: 70,
    original_price: 100,
    is_loot_deal: false,
    rating: 4.0,
    rating_count: 100,
    availability: 'in_stock',
    expires_at: null,
    created_at: '2026-04-25T00:00:00.000Z',
    ...overrides,
  };
}

const NOW = new Date('2026-04-25T12:00:00.000Z');

describe('computeDealScore', () => {
  it('rewards larger discounts', () => {
    const small = computeDealScore({ deal: makeDeal({ discount_percentage: 10 }), now: NOW });
    const large = computeDealScore({ deal: makeDeal({ discount_percentage: 80 }), now: NOW });
    expect(large).toBeGreaterThan(small);
  });

  it('rewards a price equal to or below the lowest recent price', () => {
    const noHistory = computeDealScore({ deal: makeDeal(), now: NOW });
    const matchedLow = computeDealScore({
      deal: makeDeal({ discount_price: 70 }),
      lowestRecentPrice: 70,
      now: NOW,
    });
    expect(matchedLow).toBeGreaterThanOrEqual(noHistory);
  });

  it('penalises out-of-stock items heavily', () => {
    const inStock = computeDealScore({
      deal: makeDeal({ availability: 'in_stock' }),
      now: NOW,
    });
    const outOfStock = computeDealScore({
      deal: makeDeal({ availability: 'out_of_stock' }),
      now: NOW,
    });
    expect(outOfStock).toBeLessThan(inStock * 0.5);
  });

  it('adds urgency bonus when expiry is within 24h', () => {
    const expiringSoon = computeDealScore({
      deal: makeDeal({ expires_at: '2026-04-26T08:00:00.000Z' }),
      now: NOW,
    });
    const noExpiry = computeDealScore({
      deal: makeDeal({ expires_at: null }),
      now: NOW,
    });
    expect(expiringSoon).toBeGreaterThan(noExpiry);
  });

  it('tracks demand momentum from recent clicks', () => {
    const cold = computeDealScore({ deal: makeDeal(), recentClicks: 0, now: NOW });
    const hot = computeDealScore({ deal: makeDeal(), recentClicks: 10_000, now: NOW });
    expect(hot).toBeGreaterThan(cold);
  });

  it('returns a number in [0, 100]', () => {
    const s = computeDealScore({
      deal: makeDeal({ discount_percentage: 90, rating: 5, rating_count: 5000 }),
      lowestRecentPrice: 50,
      recentClicks: 1_000_000,
      now: NOW,
    });
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });

  it('treats non-positive discount_price as no price-history match (no divide-by-zero)', () => {
    const base = computeDealScore({
      deal: makeDeal({ discount_price: 70, discount_percentage: 30 }),
      lowestRecentPrice: 50,
      now: NOW,
    });
    const zeroPrice = computeDealScore({
      deal: makeDeal({ discount_price: 0, discount_percentage: 30 }),
      lowestRecentPrice: 50,
      now: NOW,
    });
    expect(zeroPrice).toBeDefined();
    expect(Number.isFinite(zeroPrice)).toBe(true);
    expect(zeroPrice).toBeLessThanOrEqual(base);
  });

  it('does not blow up when rating fields are null', () => {
    const s = computeDealScore({
      deal: makeDeal({ rating: null, rating_count: null }),
      now: NOW,
    });
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });

  it('drops recency to zero when created_at is in the future (clock skew)', () => {
    const normal = computeDealScore({
      deal: makeDeal({ created_at: '2026-04-25T12:00:00.000Z' }),
      now: NOW,
    });
    const skewed = computeDealScore({
      deal: makeDeal({ created_at: '2027-01-01T00:00:00.000Z' }),
      now: NOW,
    });
    expect(skewed).toBeLessThan(normal);
  });
});

describe('isHeadlineDeal', () => {
  it('flags scores >= 70 as headline-worthy', () => {
    expect(isHeadlineDeal(70)).toBe(true);
    expect(isHeadlineDeal(69.9)).toBe(false);
  });
});
