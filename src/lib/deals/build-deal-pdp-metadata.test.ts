import { describe, expect, it } from 'vitest';
import type { Deal } from '@/types/database.types';
import { buildDealPdpMetadata } from './build-deal-pdp-metadata';

function minimalDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    merchant_id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Test deal',
    description: null,
    original_price: 100,
    discount_price: 80,
    discount_percentage: 20,
    affiliate_url: 'https://example.com',
    image_url: null,
    is_loot_deal: false,
    is_active: true,
    expires_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    category_slug: null,
    ingest_external_id: null,
    ...overrides,
  };
}

describe('buildDealPdpMetadata', () => {
  it('sets canonical and OG URL', () => {
    const m = buildDealPdpMetadata({
      origin: 'http://127.0.0.1:3010',
      deal: minimalDeal(),
    });
    expect(m.alternates?.canonical).toBe(
      'http://127.0.0.1:3010/deals/550e8400-e29b-41d4-a716-446655440000'
    );
    expect(m.openGraph?.url).toBe(m.alternates?.canonical);
  });

  it('uses absolute https image for OG when provided', () => {
    const m = buildDealPdpMetadata({
      origin: 'https://dealasteal.example',
      deal: minimalDeal({
        image_url: 'https://cdn.dummyjson.com/product-images/1/thumbnail.webp',
      }),
    });
    expect(m.openGraph?.images).toEqual([
      { url: 'https://cdn.dummyjson.com/product-images/1/thumbnail.webp', alt: 'Test deal' },
    ]);
    expect(m.twitter?.card).toBe('summary_large_image');
  });

  it('resolves relative image against origin', () => {
    const m = buildDealPdpMetadata({
      origin: 'https://dealasteal.example',
      deal: minimalDeal({ image_url: '/uploads/x.webp' }),
    });
    expect((m.openGraph?.images as { url: string }[] | undefined)?.[0]?.url).toBe(
      'https://dealasteal.example/uploads/x.webp'
    );
  });
});
