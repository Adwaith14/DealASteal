import type { CatalogSortMode } from '@/constants/deal-browse-filters';

type DealListHrefParts = {
  page?: number;
  q?: string;
  category?: string;
  store?: string;
  minDiscount?: number;
  maxPrice?: number;
  /** When true, adds ``loot=1`` (loot / hot-style deals on the home browse view). */
  lootDeals?: boolean;
  /** List ordering on ``/deals`` (curated row modes). */
  sort?: CatalogSortMode;
};

/**
 * Build list URLs with stable ordering of query params (pagination + search + facets).
 */
export function buildDealListHref(
  pathname: string,
  parts: DealListHrefParts
): string {
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
  if (parts.sort) {
    params.set('sort', parts.sort);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * Build home feed URLs with stable ordering of query params (pagination + search + facets).
 */
export function buildHomeDealListHref(parts: DealListHrefParts): string {
  return buildDealListHref('/', parts);
}
