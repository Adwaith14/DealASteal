import type { DealIngestPayload } from '@/types/schemas';

/**
 * Minimal PA-API 5 ``Item`` shape we care about for ingest. The real API
 * returns a large tree — keep this type intentionally small; extend when
 * you wire full normalization.
 *
 * @see https://webservices.amazon.com/paapi5/documentation/get-items.html
 */
export type AmazonPaapiItemLike = {
  ASIN?: string;
  ItemInfo?: {
    Title?: { DisplayValue?: string };
    ByLineInfo?: { Brand?: { DisplayValue?: string } };
  };
  Offers?: {
    Listings?: Array<{
      Price?: { Amount?: number; Currency?: string };
      SavingBasis?: { Amount?: number };
    }>;
  };
  DetailPageURL?: string;
  Images?: { Primary?: { Large?: { URL?: string } } };
};

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Map one PA-API ``GetItems`` / ``SearchItems`` element → ``DealIngestSchema``.
 * List vs sale: uses ``SavingBasis.Amount`` as list when present, else +10 %
 * demo uplift (replace with real ``Offers.Listings[].SavingBasis`` rules).
 */
export function mapAmazonPaapiItemToDealIngest(
  item: AmazonPaapiItemLike,
  opts: {
    merchantId: string;
    /** Amazon Associates ``tag`` query param (required for compliant links). */
    partnerTag: string;
  }
): DealIngestPayload {
  const asin = (item.ASIN ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(asin)) {
    throw new Error('Amazon PA-API item must include a valid 10-char ASIN');
  }

  const title =
    item.ItemInfo?.Title?.DisplayValue?.trim().slice(0, 500) ?? `Amazon ${asin}`;
  const listing = item.Offers?.Listings?.[0];
  const sale = listing?.Price?.Amount;
  const listFromOffer = listing?.SavingBasis?.Amount;
  const discount_price = roundMoney(
    typeof sale === 'number' && Number.isFinite(sale) && sale > 0 ? sale : 0.01
  );
  const original_price = roundMoney(
    typeof listFromOffer === 'number' && Number.isFinite(listFromOffer) && listFromOffer >= discount_price
      ? listFromOffer
      : Math.max(discount_price * 1.1, discount_price)
  );

  const tag = opts.partnerTag.trim();
  const detail = item.DetailPageURL?.trim();
  const affiliate_url =
    detail && /^https?:\/\//i.test(detail)
      ? (detail.includes('tag=') ? detail : `${detail}${detail.includes('?') ? '&' : '?'}tag=${encodeURIComponent(tag)}`)
      : `https://www.amazon.com/dp/${asin}?tag=${encodeURIComponent(tag)}`;

  const image = item.Images?.Primary?.Large?.URL?.trim();
  const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue?.trim();

  return {
    merchant_id: opts.merchantId,
    title,
    original_price,
    discount_price,
    affiliate_url,
    is_loot_deal: original_price > discount_price * 1.25,
    ingest_external_id: `amazon:${asin}`,
    trust_bundle: {
      affiliate_network: 'amazon-paapi5',
      pipeline: 'paapi5-v1',
    },
    currency: (listing?.Price?.Currency ?? 'USD').trim().toUpperCase().slice(0, 3) || 'USD',
    asin,
    ...(brand ? { brand: brand.slice(0, 200) } : {}),
    ...(image ? { image_url: image } : {}),
  };
}
