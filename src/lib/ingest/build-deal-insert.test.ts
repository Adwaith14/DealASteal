import { describe, expect, it } from 'vitest';
import { DealIngestSchema, type DealIngestPayload } from '@/types/schemas';
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
      ingest_external_id: null,
      trust_bundle: {},
      currency: 'USD',
      merchant_sku: null,
      asin: null,
      gtin: null,
      brand: null,
      rating: null,
      rating_count: null,
      availability: null,
      last_seen_at: null,
    });
  });

  it('passes through v2 catalog fields when present (post-Zod normalisation)', () => {
    const payload = DealIngestSchema.parse({
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Pixel 9 Pro',
      original_price: 999,
      discount_price: 749,
      affiliate_url: 'https://example.com/pixel',
      is_loot_deal: true,
      currency: 'usd',
      asin: 'b0a1b2c3d4',
      gtin: '0193030123456',
      brand: 'Google',
      rating: 4.6,
      rating_count: 1284,
      availability: 'in_stock',
      last_seen_at: '2026-04-25T10:00:00.000Z',
      merchant_sku: 'GOOG-PXL9P-128',
    }) as DealIngestPayload;

    const row = buildDealInsertRow(payload);
    expect(row.currency).toBe('USD');
    expect(row.asin).toBe('B0A1B2C3D4');
    expect(row.gtin).toBe('0193030123456');
    expect(row.brand).toBe('Google');
    expect(row.rating).toBe(4.6);
    expect(row.rating_count).toBe(1284);
    expect(row.availability).toBe('in_stock');
    expect(row.last_seen_at).toBe('2026-04-25T10:00:00.000Z');
    expect(row.merchant_sku).toBe('GOOG-PXL9P-128');
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

  it('passes through optional description, image_url, expires_at', () => {
    const payload: DealIngestPayload = {
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
      original_price: 100,
      discount_price: 75,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
      description: 'Hello',
      image_url: 'https://example.com/i.jpg',
      expires_at: '2027-01-01T00:00:00.000Z',
    };

    const row = buildDealInsertRow(payload);
    expect(row.description).toBe('Hello');
    expect(row.image_url).toBe('https://example.com/i.jpg');
    expect(row.expires_at).toBe('2027-01-01T00:00:00.000Z');
  });

  it('passes through optional trust_bundle', () => {
    const payload: DealIngestPayload = {
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
      original_price: 100,
      discount_price: 75,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
      trust_bundle: {
        affiliate_network: 'impact',
        link_verified_at: '2026-06-01T12:00:00.000Z',
      },
    };

    expect(buildDealInsertRow(payload).trust_bundle).toEqual({
      affiliate_network: 'impact',
      link_verified_at: '2026-06-01T12:00:00.000Z',
    });
  });

  it('passes through optional ingest_external_id', () => {
    const payload: DealIngestPayload = {
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
      original_price: 100,
      discount_price: 75,
      affiliate_url: 'https://example.com',
      is_loot_deal: false,
      ingest_external_id: ' vendor:42 ',
    };

    expect(buildDealInsertRow(payload).ingest_external_id).toBe('vendor:42');
  });
});
