import { isDealCategorySlug } from '@/constants/deal-categories';
import type { DealIngestPayload } from '@/types/schemas';
import type { AffiliateRestOffer } from './types';

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function mapCategory(category?: string): DealIngestPayload['category_slug'] {
  if (!category) return undefined;
  const c = category.trim().toLowerCase();
  if (!c) return undefined;
  if (isDealCategorySlug(c)) return c;
  if (c.includes('home') || c.includes('furniture') || c.includes('kitchen')) return 'home';
  if (c.includes('laptop')) return 'laptops';
  if (c.includes('fashion') || c.includes('beauty') || c.includes('apparel')) return 'fashion';
  return 'tech';
}

export type NormalizeAffiliateRestOfferOptions = {
  merchantId: string;
  source: string;
  merchantScope?: string;
  lootThresholdPct?: number;
};

export function normalizeAffiliateRestOffer(
  offer: AffiliateRestOffer,
  options: NormalizeAffiliateRestOfferOptions
): DealIngestPayload {
  const listPrice = roundMoney(offer.list_price ?? offer.sale_price);
  const salePrice = roundMoney(offer.sale_price);
  const originalPrice = Math.max(listPrice, salePrice);
  const pct = originalPrice > 0 ? ((originalPrice - salePrice) / originalPrice) * 100 : 0;
  const threshold = options.lootThresholdPct ?? 30;

  const expiresAt = offer.expires_at ? new Date(offer.expires_at).toISOString() : undefined;
  const description = offer.description?.trim();
  const imageUrl = offer.image_url?.trim();

  return {
    merchant_id: options.merchantId,
    title: offer.title.trim().slice(0, 500),
    original_price: originalPrice,
    discount_price: salePrice,
    affiliate_url: offer.affiliate_url,
    is_loot_deal: pct >= threshold,
    category_slug: mapCategory(offer.category),
    ingest_external_id: `${options.source}:${options.merchantScope ?? 'default'}:${String(offer.external_id).trim()}`,
    trust_bundle: {
      affiliate_network: options.source,
      pipeline: 'affiliate-rest-v1',
    },
    ...(description ? { description: description.slice(0, 4000) } : {}),
    ...(imageUrl ? { image_url: imageUrl } : {}),
    ...(expiresAt ? { expires_at: expiresAt } : {}),
  };
}
