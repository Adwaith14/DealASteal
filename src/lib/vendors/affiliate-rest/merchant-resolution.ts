import type { AffiliateRestOffer } from './types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function parseMerchantMapEnv(value: string | undefined): Record<string, string> {
  if (!value?.trim()) return {};
  const pairs = value.split(',').map((chunk) => chunk.trim()).filter(Boolean);
  const map: Record<string, string> = {};

  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx <= 0 || idx === pair.length - 1) {
      throw new Error(`Invalid AFFILIATE_MERCHANT_MAP entry: "${pair}"`);
    }
    const key = normalizeKey(pair.slice(0, idx));
    const merchantId = pair.slice(idx + 1).trim();
    if (!UUID_RE.test(merchantId)) {
      throw new Error(`Merchant ID must be UUID in AFFILIATE_MERCHANT_MAP: "${pair}"`);
    }
    if (!key) {
      throw new Error(`Merchant key missing in AFFILIATE_MERCHANT_MAP entry: "${pair}"`);
    }
    map[key] = merchantId;
  }

  return map;
}

function offerMerchantKey(offer: AffiliateRestOffer): string | null {
  const base = offer.merchant_slug ?? offer.merchant_name;
  if (!base) return null;
  const key = normalizeKey(base);
  return key || null;
}

export function resolveMerchantForOffer(
  offer: AffiliateRestOffer,
  merchantMap: Record<string, string>,
  defaultMerchantId: string | undefined
): { merchantId: string; merchantScope: string } {
  const key = offerMerchantKey(offer);
  if (key && merchantMap[key]) {
    return { merchantId: merchantMap[key], merchantScope: key };
  }

  if (defaultMerchantId) {
    return { merchantId: defaultMerchantId, merchantScope: key ?? 'default' };
  }

  throw new Error(
    `Cannot resolve merchant for offer external_id=${String(offer.external_id)}; provide AFFILIATE_DEFAULT_MERCHANT_ID or map this merchant in AFFILIATE_MERCHANT_MAP`
  );
}
