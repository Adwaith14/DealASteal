import { describe, expect, it } from 'vitest';
import type { DealIngestPayload } from '@/types/schemas';
import { buildDealInsertRow } from './build-deal-insert';

describe('buildDealInsertRow', () => {
  it('computes discount_percentage and fills defaults', () => {
    const payload: DealIngestPayload = {
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
      original_price: 100,
      discount_price: 75,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
    };

    expect(buildDealInsertRow(payload)).toEqual({
      merchant_id: payload.merchant_id,
      title: payload.title,
      description: null,
      original_price: 100,
      discount_price: 75,
      discount_percentage: 25,
      affiliate_url: payload.affiliate_url,
      image_url: null,
      is_loot_deal: false,
      is_active: true,
      expires_at: null,
      category_slug: null,
    });
  });

  it('passes through optional category_slug', () => {
    const payload: DealIngestPayload = {
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
      original_price: 100,
      discount_price: 75,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
      category_slug: 'fashion',
    };

    expect(buildDealInsertRow(payload).category_slug).toBe('fashion');
  });
});
