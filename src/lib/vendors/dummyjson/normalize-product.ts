import { isDealCategorySlug } from '@/constants/deal-categories';
import type { DealIngestPayload } from '@/types/schemas';
import type { DummyJsonProduct } from './types';

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Map DummyJSON `category` string to our small allowed slug set.
 * Real affiliate feeds will have their own taxonomy → replace this function per vendor.
 */
export function mapDummyJsonCategoryToSlug(
  category: string | undefined
): DealIngestPayload['category_slug'] {
  if (!category) return undefined;
  const c = category.toLowerCase();
  if (
    c.includes('furniture') ||
    c.includes('home') ||
    c === 'groceries' ||
    c === 'kitchen-accessories'
  ) {
    return 'home';
  }
  if (
    c.includes('mens-') ||
    c.includes('womens-') ||
    c === 'beauty' ||
    c === 'fragrances' ||
    c === 'tops' ||
    c === 'womens-bags'
  ) {
    return 'fashion';
  }
  if (c === 'laptops' || c === 'tablets') {
    return 'laptops';
  }
  if (isDealCategorySlug(c)) {
    return c;
  }
  return 'tech';
}

/**
 * DummyJSON exposes `price` and `discountPercentage`. We treat `price` as the **deal (sale) price**
 * and derive a list/original price when a discount % is present (demo math only — real feeds should
 * supply explicit list + sale prices from the network).
 */
export function dummyJsonListAndSalePrice(product: DummyJsonProduct): {
  discount_price: number;
  original_price: number;
} {
  const discount_price = roundMoney(product.price);
  const pct = Math.min(Math.max(product.discountPercentage ?? 0, 0), 99.99);
  if (pct <= 0) {
    return { discount_price, original_price: discount_price };
  }
  const original_price = roundMoney(discount_price / (1 - pct / 100));
  return {
    discount_price,
    original_price: Math.max(original_price, discount_price),
  };
}

export type NormalizeDummyJsonProductOptions = {
  merchantId: string;
  /**
   * Outbound URL template for the "Grab the Deal" button.
   * Replace with real tracking links when you leave DummyJSON.
   */
  buildAffiliateUrl?: (product: DummyJsonProduct) => string;
};

const defaultAffiliateUrl = (product: DummyJsonProduct) =>
  `https://example.com/dummyjson-deal/${product.id}`;

/**
 * Pure normalizer: DummyJSON product → payload accepted by `POST /api/ingest/deals`.
 * Keeps all DummyJSON-specific rules in one place for easy vendor swap later.
 */
export function normalizeDummyJsonProduct(
  product: DummyJsonProduct,
  options: NormalizeDummyJsonProductOptions
): DealIngestPayload {
  const { discount_price, original_price } = dummyJsonListAndSalePrice(product);
  const buildUrl = options.buildAffiliateUrl ?? defaultAffiliateUrl;
  const image = product.thumbnail ?? product.images?.[0];
  const desc = product.description?.trim();
  const loot = (product.discountPercentage ?? 0) >= 30;

  const sku = product.sku?.trim();
  const brand = product.brand?.trim();

  return {
    merchant_id: options.merchantId,
    title: product.title.trim().slice(0, 500),
    original_price,
    discount_price,
    affiliate_url: buildUrl(product),
    is_loot_deal: loot,
    category_slug: mapDummyJsonCategoryToSlug(product.category),
    /** Enables idempotent ingest / upsert when re-running DummyJSON sync. */
    ingest_external_id: `dummyjson:${product.id}`,
    trust_bundle: {
      affiliate_network: 'dummyjson',
      pipeline: 'dummyjson-v1',
    },
    /** Same shape as PA-API / Walmart when ``DEALS_DB_V2=1``; stripped on ingest until then. */
    currency: 'USD',
    merchant_sku: sku && sku.length > 0 ? sku.slice(0, 200) : `dummyjson:${product.id}`,
    ...(brand && brand.length > 0 ? { brand: brand.slice(0, 200) } : {}),
    ...(desc ? { description: desc.slice(0, 4000) } : {}),
    ...(image ? { image_url: image } : {}),
  };
}
