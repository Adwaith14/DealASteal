import { describe, expect, it } from 'vitest';
import type { Deal } from '@/types/database.types';
import { getDealUrgencyForDisplay } from './deal-pdp-urgency';

function baseDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    merchant_id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Test',
    description: null,
    original_price: 100,
    discount_price: 80,
    discount_percentage: 20,
    affiliate_url: 'https://example.com',
    image_url: null,
    is_loot_deal: false,
    is_active: true,
    expires_at: null,
    created_at: '2020-01-01T00:00:00.000Z',
    category_slug: null,
    ingest_external_id: null,
    ...overrides,
  };
}

describe('getDealUrgencyForDisplay', () => {
  it('returns high urgency for loot deals', () => {
    expect(getDealUrgencyForDisplay(baseDeal({ is_loot_deal: true }))).toEqual({
      label: 'Almost gone!',
      percent: 93,
      bar: 'red',
    });
  });

  it('returns orange when expiry is within a week', () => {
    const now = Date.parse('2026-06-01T12:00:00.000Z');
    const expires = new Date(now + 3 * 86400000).toISOString();
    expect(getDealUrgencyForDisplay(baseDeal({ expires_at: expires }), now)).toEqual({
      label: 'Selling fast',
      percent: 66,
      bar: 'orange',
    });
  });

  it('returns green availability otherwise', () => {
    const now = Date.parse('2026-06-01T12:00:00.000Z');
    expect(getDealUrgencyForDisplay(baseDeal({ expires_at: null }), now)).toEqual({
      label: 'Good availability',
      percent: 24,
      bar: 'green',
    });
  });

  it('returns green when expiry is already past', () => {
    const now = Date.parse('2026-06-01T12:00:00.000Z');
    const past = new Date(now - 86400000).toISOString();
    expect(getDealUrgencyForDisplay(baseDeal({ expires_at: past }), now).bar).toBe('green');
  });
});
