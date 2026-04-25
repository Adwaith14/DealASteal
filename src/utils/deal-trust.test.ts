import { describe, expect, it } from 'vitest';
import type { Deal } from '@/types/database.types';
import { trustAffiliateSourceLabel } from './deal-trust';

const base: Deal = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  merchant_id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'T',
  description: null,
  original_price: 10,
  discount_price: 8,
  discount_percentage: 20,
  affiliate_url: 'https://example.com',
  image_url: null,
  is_loot_deal: false,
  is_active: true,
  expires_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
  category_slug: null,
  ingest_external_id: null,
};

describe('trustAffiliateSourceLabel', () => {
  it('returns null when bundle missing or empty', () => {
    expect(trustAffiliateSourceLabel(base)).toBeNull();
    expect(trustAffiliateSourceLabel({ ...base, trust_bundle: {} })).toBeNull();
  });

  it('returns trimmed affiliate_network', () => {
    expect(
      trustAffiliateSourceLabel({
        ...base,
        trust_bundle: { affiliate_network: '  impact  ' },
      })
    ).toBe('impact');
  });
});
