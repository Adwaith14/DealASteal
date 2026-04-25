/**
 * Phase 5 home-feed filters (query params + Supabase constraints).
 * Store matching uses fixed ILIKE needles on ``affiliate_url`` — only whitelisted keys are applied.
 */

export const DEAL_STORE_FILTER_KEYS = ['amazon', 'walmart', 'target', 'bestbuy'] as const;

export type DealStoreFilterKey = (typeof DEAL_STORE_FILTER_KEYS)[number];

/** Substrings matched case-insensitively on ``deals.affiliate_url``. */
export const DEAL_STORE_URL_NEEDLES: Record<DealStoreFilterKey, string> = {
  amazon: '%amazon%',
  walmart: '%walmart%',
  target: '%target%',
  bestbuy: '%bestbuy%',
};

export const DEAL_STORE_LABELS: Record<DealStoreFilterKey, string> = {
  amazon: 'Amazon',
  walmart: 'Walmart',
  target: 'Target',
  bestbuy: 'Best Buy',
};

export function isDealStoreFilterKey(value: string): value is DealStoreFilterKey {
  return (DEAL_STORE_FILTER_KEYS as readonly string[]).includes(value);
}

export const MIN_DISCOUNT_PERCENT_OPTIONS = [10, 25, 40, 50] as const;

export type MinDiscountPercent = (typeof MIN_DISCOUNT_PERCENT_OPTIONS)[number];

export function normalizeMinDiscountParam(raw: string | undefined | null): number | null {
  if (raw == null || typeof raw !== 'string') {
    return null;
  }
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n)) {
    return null;
  }
  return (MIN_DISCOUNT_PERCENT_OPTIONS as readonly number[]).includes(n) ? n : null;
}

export const MAX_DEAL_PRICE_OPTIONS = [25, 50, 100, 200, 500] as const;

export type MaxDealPrice = (typeof MAX_DEAL_PRICE_OPTIONS)[number];

export function normalizeMaxPriceParam(raw: string | undefined | null): number | null {
  if (raw == null || typeof raw !== 'string') {
    return null;
  }
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n)) {
    return null;
  }
  return (MAX_DEAL_PRICE_OPTIONS as readonly number[]).includes(n) ? n : null;
}

export function normalizeStoreParam(raw: string | undefined | null): DealStoreFilterKey | null {
  if (raw == null || typeof raw !== 'string') {
    return null;
  }
  const key = raw.trim().toLowerCase();
  return isDealStoreFilterKey(key) ? key : null;
}

const LOOT_DEALS_TRUTHY = new Set(['1', 'true', 'yes', 'on']);

/** URL ``loot=`` — browse mode for loot / “hot” style deals (``is_loot_deal``). */
export function normalizeLootDealsParam(raw: string | undefined | null): boolean {
  if (raw == null || typeof raw !== 'string') {
    return false;
  }
  return LOOT_DEALS_TRUTHY.has(raw.trim().toLowerCase());
}

/** Home browse grid ordering (URL ``sort=``). */
export const DEAL_SORT_KEYS = ['newest', 'discount_desc', 'price_asc', 'price_desc'] as const;

export type DealSortKey = (typeof DEAL_SORT_KEYS)[number];

export const DEAL_SORT_LABELS: Record<DealSortKey, string> = {
  newest: 'Newest',
  discount_desc: 'Best discount',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
};

export function isDealSortKey(value: string): value is DealSortKey {
  return (DEAL_SORT_KEYS as readonly string[]).includes(value);
}

/** Unknown or empty → ``newest``. */
export function normalizeDealSortParam(raw: string | undefined | null): DealSortKey {
  if (raw == null || typeof raw !== 'string') {
    return 'newest';
  }
  const t = raw.trim().toLowerCase();
  return isDealSortKey(t) ? t : 'newest';
}
