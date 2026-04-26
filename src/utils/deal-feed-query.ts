import type { DealSortKey } from '@/constants/deal-browse-filters';

export type DealListBasePath = '/' | '/search';

export type DealListHrefParts = {
  page?: number;
  q?: string;
  category?: string;
  store?: string;
  minDiscount?: number;
  maxPrice?: number;
  /** When true, adds ``loot=1`` (loot / hot-style deals on the home browse view). */
  lootDeals?: boolean;
  /** Omit or ``newest`` → no ``sort`` param (default grid order). ``relevance`` is always emitted. */
  sort?: DealSortKey;
};

/**
 * Build deal browse URLs (home ``/`` or dedicated ``/search``) with stable query param order.
 */
export function buildDealListHref(base: DealListBasePath, parts: DealListHrefParts): string {
  const params = new URLSearchParams();
  const page = parts.page;
  if (page != null && page > 1) {
    params.set('page', String(page));
  }
  const q = parts.q?.trim();
  if (q) {
    params.set('q', q);
  }
  const category = parts.category?.trim();
  if (category) {
    params.set('category', category);
  }
  const store = parts.store?.trim();
  if (store) {
    params.set('store', store);
  }
  const minDiscount = parts.minDiscount;
  if (minDiscount != null && minDiscount > 0) {
    params.set('min_disc', String(minDiscount));
  }
  const maxPrice = parts.maxPrice;
  if (maxPrice != null && maxPrice > 0) {
    params.set('max_price', String(maxPrice));
  }
  if (parts.lootDeals) {
    params.set('loot', '1');
  }
  const sort = parts.sort;
  if (sort != null && sort !== 'newest') {
    params.set('sort', sort);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** @deprecated Prefer ``buildDealListHref('/', parts)`` — kept for call sites on the home route. */
export function buildHomeDealListHref(parts: DealListHrefParts): string {
  return buildDealListHref('/', parts);
}
