import type { ActiveDealsQuery } from '@/services/api/deals';
import {
  normalizeCatalogSortParam,
  normalizeLootDealsParam,
  normalizeMaxPriceParam,
  normalizeMinDiscountParam,
  normalizeStoreParam,
} from '@/constants/deal-browse-filters';

function pick(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  if (v === undefined) {
    return undefined;
  }
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Maps URL / Next ``searchParams`` into ``getActiveDeals`` input (used by pages and ``GET /api/deals/active``).
 */
export function parseActiveDealsBrowseFromSearchParams(
  sp: Record<string, string | string[] | undefined>
): ActiveDealsQuery {
  const rawPage = Number.parseInt(pick(sp, 'page') ?? '1', 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.min(rawPage, 10_000) : 1;
  const rawSize = Number.parseInt(pick(sp, 'pageSize') ?? '12', 10);
  const pageSize =
    Number.isFinite(rawSize) && rawSize >= 1 ? Math.min(Math.max(rawSize, 1), 48) : 12;

  const q = pick(sp, 'q')?.trim() ?? '';
  const category = pick(sp, 'category') ?? '';
  const appliedStore = normalizeStoreParam(pick(sp, 'store'));
  const appliedMaxPrice = normalizeMaxPriceParam(pick(sp, 'max_price'));
  const appliedMinDiscount = normalizeMinDiscountParam(pick(sp, 'min_disc'));
  const appliedLootOnly = normalizeLootDealsParam(pick(sp, 'loot'));
  const appliedSort = normalizeCatalogSortParam(pick(sp, 'sort'));

  return {
    page,
    pageSize,
    query: q || undefined,
    category: category || undefined,
    store: appliedStore ?? undefined,
    minDiscount: appliedMinDiscount ?? undefined,
    maxPrice: appliedMaxPrice ?? undefined,
    lootOnly: appliedLootOnly || undefined,
    sort: appliedSort ?? undefined,
  };
}
