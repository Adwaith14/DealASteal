import { describe, expect, it } from 'vitest';
import {
  AdminDealPatchSchema,
  AdminNetworkSettingsPatchSchema,
  CouponIngestSchema,
  CouponIngestUpdateSchema,
  DealIngestSchema,
} from './schemas';

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

  it('accepts optional ingest_external_id', () => {
    const result = DealIngestSchema.safeParse({
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'x',
      original_price: 10,
      discount_price: 5,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
      ingest_external_id: 'vendor:abc-1',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional trust_bundle with allowed keys', () => {
    const result = DealIngestSchema.safeParse({
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'x',
      original_price: 10,
      discount_price: 5,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
      trust_bundle: {
        affiliate_network: 'impact',
        pipeline: 'affiliate-rest-v1',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects trust_bundle with unknown keys', () => {
    const result = DealIngestSchema.safeParse({
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'x',
      original_price: 10,
      discount_price: 5,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
      trust_bundle: { rogue: true },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty ingest_external_id', () => {
    const result = DealIngestSchema.safeParse({
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'x',
      original_price: 10,
      discount_price: 5,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
      ingest_external_id: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional description, image_url, expires_at', () => {
    const result = DealIngestSchema.safeParse({
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'x',
      original_price: 10,
      discount_price: 5,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
      description: 'Short body',
      image_url: 'https://example.com/a.jpg',
      expires_at: '2027-06-01T12:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid expires_at string', () => {
    const result = DealIngestSchema.safeParse({
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'x',
      original_price: 10,
      discount_price: 5,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
      expires_at: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

describe('CouponIngestSchema', () => {
  it('accepts a valid payload', () => {
    const result = CouponIngestSchema.safeParse({
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      deal_id: '660e8400-e29b-41d4-a716-446655440001',
      code: 'SAVE10',
      title: 'Save 10%',
      discount_type: 'percent',
      discount_value: 10,
      affiliate_url: 'https://example.com/coupon',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown keys when strict', () => {
    const result = CouponIngestSchema.safeParse({
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      code: 'SAVE10',
      title: 'Save 10%',
      discount_type: 'percent',
      discount_value: 10,
      affiliate_url: 'https://example.com/coupon',
      rogue: true,
    });
    expect(result.success).toBe(false);
  });
});

describe('CouponIngestUpdateSchema', () => {
  it('requires at least one field besides id', () => {
    const result = CouponIngestUpdateSchema.safeParse({
      id: '660e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(false);
  });
});

describe('AdminNetworkSettingsPatchSchema', () => {
  it('requires a patch field besides network_slug', () => {
    expect(AdminNetworkSettingsPatchSchema.safeParse({ network_slug: 'ebay' }).success).toBe(false);
  });

  it('accepts ingest_enabled', () => {
    expect(
      AdminNetworkSettingsPatchSchema.safeParse({ network_slug: 'walmart', ingest_enabled: false }).success
    ).toBe(true);
  });
});

describe('AdminDealPatchSchema', () => {
  it('rejects empty object', () => {
    expect(AdminDealPatchSchema.safeParse({}).success).toBe(false);
  });

  it('accepts pin toggle', () => {
    expect(AdminDealPatchSchema.safeParse({ pinned: true }).success).toBe(true);
  });
});
