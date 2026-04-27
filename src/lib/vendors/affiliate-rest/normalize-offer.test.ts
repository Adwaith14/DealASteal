import { describe, expect, it } from 'vitest';
import { DealIngestSchema } from '@/types/schemas';
import { normalizeAffiliateRestOffer } from './normalize-offer';
import type { AffiliateRestOffer } from './types';

const MERCHANT = '550e8400-e29b-41d4-a716-446655440000';

describe('normalizeAffiliateRestOffer', () => {
  it('maps a REST offer into a valid deal ingest payload', () => {
    const offer: AffiliateRestOffer = {
      external_id: 'impact-991',
      title: 'Executive Chair',
      sale_price: 109.99,
      list_price: 199.99,
      affiliate_url: 'https://track.example.com/impact-991',
      image_url: 'https://cdn.example.com/chair.jpg',
      category: 'furniture',
      description: 'High-back ergonomic chair',
      expires_at: '2026-06-01T00:00:00.000Z',
    };

    const payload = normalizeAffiliateRestOffer(offer, {
      merchantId: MERCHANT,
      source: 'impact',
      merchantScope: 'target',
    });
    const parsed = DealIngestSchema.safeParse(payload);

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.ingest_external_id).toBe('impact:target:impact-991');
    expect(parsed.data.category_slug).toBe('home');
    expect(parsed.data.is_loot_deal).toBe(true);
  });
});
