import { describe, expect, it } from 'vitest';
import { DealIngestSchema } from '@/types/schemas';
import { mapAmazonPaapiItemToDealIngest } from './map-paapi-item-to-ingest';

const MERCHANT = '550e8400-e29b-41d4-a716-446655440000';

describe('mapAmazonPaapiItemToDealIngest', () => {
  it('builds a valid ingest payload with ASIN, prices, and affiliate tag', () => {
    const payload = mapAmazonPaapiItemToDealIngest(
      {
        ASIN: 'B0ABCDEFGH',
        ItemInfo: { Title: { DisplayValue: 'Echo Dot' }, ByLineInfo: { Brand: { DisplayValue: 'Amazon' } } },
        Offers: {
          Listings: [
            {
              Price: { Amount: 29.99, Currency: 'USD' },
              SavingBasis: { Amount: 49.99 },
            },
          ],
        },
        DetailPageURL: 'https://www.amazon.com/dp/B0ABCDEFGH',
        Images: { Primary: { Large: { URL: 'https://m.media-amazon.com/images/I/01.jpg' } } },
      },
      { merchantId: MERCHANT, partnerTag: 'dealasteal-20' }
    );

    const parsed = DealIngestSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.asin).toBe('B0ABCDEFGH');
    expect(parsed.data.ingest_external_id).toBe('amazon:B0ABCDEFGH');
    expect(parsed.data.affiliate_url).toContain('tag=dealasteal-20');
    expect(parsed.data.currency).toBe('USD');
    expect(parsed.data.discount_price).toBe(29.99);
    expect(parsed.data.original_price).toBe(49.99);
  });

  it('throws when ASIN is missing or invalid', () => {
    expect(() =>
      mapAmazonPaapiItemToDealIngest({ ASIN: 'bad' }, { merchantId: MERCHANT, partnerTag: 'x' })
    ).toThrow(/ASIN/);
  });
});
