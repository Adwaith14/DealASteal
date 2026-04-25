import { describe, expect, it } from 'vitest';
import { DealIngestSchema } from '@/types/schemas';
import {
  dummyJsonListAndSalePrice,
  mapDummyJsonCategoryToSlug,
  normalizeDummyJsonProduct,
} from './normalize-product';
import type { DummyJsonProduct } from './types';

const MERCHANT = '550e8400-e29b-41d4-a716-446655440000';

const sampleProduct: DummyJsonProduct = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  description: 'Popular mascara.',
  category: 'beauty',
  price: 9.99,
  discountPercentage: 10.48,
  thumbnail: 'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp',
  images: ['https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/1.webp'],
};

describe('dummyJsonListAndSalePrice', () => {
  it('derives original from discount % when present', () => {
    const p = { ...sampleProduct, price: 80, discountPercentage: 20 };
    expect(dummyJsonListAndSalePrice(p)).toEqual({
      discount_price: 80,
      original_price: 100,
    });
  });

  it('uses equal prices when no discount', () => {
    const p = { ...sampleProduct, price: 49, discountPercentage: 0 };
    expect(dummyJsonListAndSalePrice(p)).toEqual({
      discount_price: 49,
      original_price: 49,
    });
  });
});

describe('mapDummyJsonCategoryToSlug', () => {
  it('maps beauty to fashion', () => {
    expect(mapDummyJsonCategoryToSlug('beauty')).toBe('fashion');
  });

  it('maps laptops slug', () => {
    expect(mapDummyJsonCategoryToSlug('laptops')).toBe('laptops');
  });
});

describe('normalizeDummyJsonProduct', () => {
  it('produces a payload that passes DealIngestSchema', () => {
    const payload = normalizeDummyJsonProduct(sampleProduct, { merchantId: MERCHANT });
    const parsed = DealIngestSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.title).toBe(sampleProduct.title);
    expect(parsed.data.merchant_id).toBe(MERCHANT);
    expect(parsed.data.image_url).toBe(sampleProduct.thumbnail);
    expect(parsed.data.category_slug).toBe('fashion');
    expect(parsed.data.discount_price).toBeLessThanOrEqual(parsed.data.original_price);
    expect(parsed.data.ingest_external_id).toBe(`dummyjson:${sampleProduct.id}`);
    expect(parsed.data.currency).toBe('USD');
    expect(parsed.data.merchant_sku).toBe(`dummyjson:${sampleProduct.id}`);
    expect(parsed.data.trust_bundle).toEqual({
      affiliate_network: 'dummyjson',
      pipeline: 'dummyjson-v1',
    });
  });

  it('maps DummyJSON brand and sku when present', () => {
    const payload = normalizeDummyJsonProduct(
      { ...sampleProduct, brand: 'Essence', sku: 'SKU-42' },
      { merchantId: MERCHANT }
    );
    const parsed = DealIngestSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.brand).toBe('Essence');
    expect(parsed.data.merchant_sku).toBe('SKU-42');
  });

  it('uses custom affiliate URL builder', () => {
    const payload = normalizeDummyJsonProduct(sampleProduct, {
      merchantId: MERCHANT,
      buildAffiliateUrl: (p: DummyJsonProduct) => `https://track.test/?id=${p.id}`,
    });
    expect(payload.affiliate_url).toBe('https://track.test/?id=1');
  });
});
