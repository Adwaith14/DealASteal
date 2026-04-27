import { describe, expect, it } from 'vitest';
import { parseMerchantMapEnv, resolveMerchantForOffer } from './merchant-resolution';
import type { AffiliateRestOffer } from './types';

const UUID_A = '550e8400-e29b-41d4-a716-446655440000';
const UUID_B = '550e8400-e29b-41d4-a716-446655440001';

describe('parseMerchantMapEnv', () => {
  it('parses comma-separated merchant mappings', () => {
    const map = parseMerchantMapEnv(`target=${UUID_A}, walmart=${UUID_B}`);
    expect(map.target).toBe(UUID_A);
    expect(map.walmart).toBe(UUID_B);
  });
});

describe('resolveMerchantForOffer', () => {
  it('prefers merchant map key from offer merchant_slug', () => {
    const offer: AffiliateRestOffer = {
      external_id: 'abc',
      title: 'Deal',
      merchant_slug: 'Target',
      sale_price: 10,
      affiliate_url: 'https://example.test/deal',
    };

    const resolved = resolveMerchantForOffer(offer, { target: UUID_A }, UUID_B);
    expect(resolved).toEqual({ merchantId: UUID_A, merchantScope: 'target' });
  });

  it('falls back to default merchant id when no map hit', () => {
    const offer: AffiliateRestOffer = {
      external_id: 'abc',
      title: 'Deal',
      merchant_name: 'Unknown Merchant',
      sale_price: 10,
      affiliate_url: 'https://example.test/deal',
    };

    const resolved = resolveMerchantForOffer(offer, {}, UUID_B);
    expect(resolved).toEqual({ merchantId: UUID_B, merchantScope: 'unknown-merchant' });
  });
});
