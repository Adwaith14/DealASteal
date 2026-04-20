import { describe, expect, it } from 'vitest';
import { DealIngestSchema } from './schemas';

describe('DealIngestSchema', () => {
  it('accepts a valid payload', () => {
    const payload = {
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Noise-cancelling headphones',
      original_price: 199.99,
      discount_price: 149.99,
      affiliate_url: 'https://example.com/deal',
      is_loot_deal: true,
    };

    const result = DealIngestSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('accepts optional category_slug when valid', () => {
    const result = DealIngestSchema.safeParse({
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'x',
      original_price: 10,
      discount_price: 5,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
      category_slug: 'laptops',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid category_slug', () => {
    const result = DealIngestSchema.safeParse({
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'x',
      original_price: 10,
      discount_price: 5,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
      category_slug: 'invalid-slug',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid merchant_id', () => {
    const result = DealIngestSchema.safeParse({
      merchant_id: 'not-a-uuid',
      title: 'x',
      original_price: 10,
      discount_price: 5,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
    });

    expect(result.success).toBe(false);
  });

  it('rejects discount_price greater than original_price', () => {
    const result = DealIngestSchema.safeParse({
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'x',
      original_price: 10,
      discount_price: 11,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown keys when strict', () => {
    const result = DealIngestSchema.safeParse({
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'x',
      original_price: 10,
      discount_price: 5,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
      extra: true,
    });

    expect(result.success).toBe(false);
  });
});
