import type { DealStoreFilterKey } from '@/constants/deal-browse-filters';
import {
  DEAL_STORE_URL_NEEDLES,
  isDealStoreFilterKey,
  MAX_DEAL_PRICE_OPTIONS,
  MIN_DISCOUNT_PERCENT_OPTIONS,
} from '@/constants/deal-browse-filters';
import { isDealCategorySlug } from '@/constants/deal-categories';
import { getSupabaseServerAnon } from '@/lib/supabase/server';
import type { Deal } from '@/types/database.types';
import { logPostgrestError } from './log-postgrest-error';
import { mapDealsPostgrestError } from './map-deals-postgrest-user-message';

const ACTIVE_DEALS_SELECT =
  'id, merchant_id, title, description, original_price, discount_price, discount_percentage, affiliate_url, image_url, is_loot_deal, is_active, expires_at, created_at, category_slug, ingest_external_id' as const;

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 48;
const MAX_SEARCH_LEN = 80;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ActiveDealsQuery = {
  page?: number;
  pageSize?: number;
  /** Plain-text substring matched with case-insensitive ``ILIKE`` on ``title``. */
  query?: string;
  /** URL ``category`` param; only known slugs apply a filter. */
  category?: string;
  /** URL ``store`` param; only whitelisted keys apply an ``affiliate_url`` ILIKE filter. */
  store?: string;
  /** Minimum ``discount_percentage`` (URL ``min_disc``). */
  minDiscount?: number;
  /** Maximum ``discount_price`` in USD (URL ``max_price``). */
  maxPrice?: number;
  /** When true, only ``is_loot_deal`` rows (URL ``loot=1``). */
  lootOnly?: boolean;
};

export type ActiveDealsFetchSuccess = {
  ok: true;
  deals: Deal[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  appliedQuery: string;
  appliedCategorySlug: string | null;
  appliedStore: DealStoreFilterKey | null;
  appliedMinDiscount: number | null;
  appliedMaxPrice: number | null;
  appliedLootOnly: boolean;
};

export type ActiveDealsFetchFailure = {
  ok: false;
  deals: [];
  error: string;
  /** PostgREST / network detail for logs and optional UI in development. */
  code?: string;
  hint?: string;
};

export type ActiveDealsFetchResult =
  | ActiveDealsFetchSuccess
  | ActiveDealsFetchFailure;

export type ActiveDealByIdResult =
  | { ok: true; deal: Deal }
  | {
      ok: false;
      error: 'invalid_id' | 'not_found' | 'database_error';
      message: string;
      code?: string;
    };

function normalizeCategorySlug(raw: string | undefined): string | null {
  if (raw == null || typeof raw !== 'string') {
    return null;
  }
  const t = raw.trim().toLowerCase();
  if (!t) {
    return null;
  }
  if (!isDealCategorySlug(t)) {
    return null;
  }
  return t;
}

function normalizePagination(query: ActiveDealsQuery | undefined): {
  page: number;
  pageSize: number;
  search: string | null;
  categorySlug: string | null;
  storeKey: DealStoreFilterKey | null;
  minDiscount: number | null;
  maxPrice: number | null;
  lootOnly: boolean;
} {
  const rawPage = query?.page ?? 1;
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const rawSize = query?.pageSize ?? DEFAULT_PAGE_SIZE;
  const pageSize =
    Number.isFinite(rawSize) && rawSize >= 1
      ? Math.min(Math.floor(rawSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  const q = typeof query?.query === 'string' ? query.query.trim() : '';
  const search = q.length > 0 ? q.slice(0, MAX_SEARCH_LEN) : null;
  const categorySlug = normalizeCategorySlug(query?.category);
  const storeRaw = typeof query?.store === 'string' ? query.store.trim().toLowerCase() : '';
  const storeKey = storeRaw && isDealStoreFilterKey(storeRaw) ? storeRaw : null;
  const rawMin = query?.minDiscount;
  const minDiscountFloored =
    typeof rawMin === 'number' && Number.isFinite(rawMin) && rawMin > 0 ? Math.floor(rawMin) : null;
  const minDiscount =
    minDiscountFloored != null &&
    (MIN_DISCOUNT_PERCENT_OPTIONS as readonly number[]).includes(minDiscountFloored)
      ? minDiscountFloored
      : null;
  const rawMax = query?.maxPrice;
  const maxPriceFloored =
    typeof rawMax === 'number' && Number.isFinite(rawMax) && rawMax > 0 ? Math.floor(rawMax) : null;
  const maxPrice =
    maxPriceFloored != null && (MAX_DEAL_PRICE_OPTIONS as readonly number[]).includes(maxPriceFloored)
      ? maxPriceFloored
      : null;
  const lootOnly = query?.lootOnly === true;
  return { page, pageSize, search, categorySlug, storeKey, minDiscount, maxPrice, lootOnly };
}

function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * Paginated active deals for the home feed (anon key + RLS).
 * On failure: logs the full PostgREST error object and returns ``ok: false`` (never silent).
 */
export async function getActiveDeals(
  query?: ActiveDealsQuery
): Promise<ActiveDealsFetchResult> {
  const { page, pageSize, search, categorySlug, storeKey, minDiscount, maxPrice, lootOnly } =
    normalizePagination(query);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const supabase = getSupabaseServerAnon();
    let builder = supabase
      .from('deals')
      .select(ACTIVE_DEALS_SELECT, { count: 'exact' })
      .eq('is_active', true);

    if (categorySlug) {
      builder = builder.eq('category_slug', categorySlug);
    }

    if (storeKey) {
      builder = builder.ilike('affiliate_url', DEAL_STORE_URL_NEEDLES[storeKey]);
    }

    if (minDiscount != null) {
      builder = builder.gte('discount_percentage', minDiscount);
    }

    if (maxPrice != null) {
      builder = builder.lte('discount_price', maxPrice);
    }

    if (search) {
      const pattern = `%${escapeIlikePattern(search)}%`;
      builder = builder.ilike('title', pattern);
    }

    if (lootOnly) {
      builder = builder.eq('is_loot_deal', true);
    }

    const { data, error, count } = await builder
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      logPostgrestError('getActiveDeals failed', error);
      return {
        ok: false,
        deals: [],
        error: mapDealsPostgrestError('Failed to load deals', error),
        code: error.code,
        hint: error.hint ?? undefined,
      };
    }

    const deals = (data ?? []) as Deal[];
    const totalCount = count ?? deals.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return {
      ok: true,
      deals,
      page,
      pageSize,
      totalCount,
      totalPages,
      appliedQuery: search ?? '',
      appliedCategorySlug: categorySlug,
      appliedStore: storeKey,
      appliedMinDiscount: minDiscount,
      appliedMaxPrice: maxPrice,
      appliedLootOnly: lootOnly,
    };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : 'Unexpected error loading deals';
    console.error('[DealASteal] getActiveDeals failed:', cause);
    return {
      ok: false,
      deals: [],
      error: message,
    };
  }
}

/**
 * Single active deal for PDP (anon key + RLS). Validates UUID shape before querying.
 */
export async function getActiveDealById(id: string): Promise<ActiveDealByIdResult> {
  const trimmed = id.trim();
  if (!UUID_RE.test(trimmed)) {
    return {
      ok: false,
      error: 'invalid_id',
      message: 'Deal id must be a valid UUID',
    };
  }

  try {
    const supabase = getSupabaseServerAnon();
    const { data, error } = await supabase
      .from('deals')
      .select(ACTIVE_DEALS_SELECT)
      .eq('id', trimmed)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      logPostgrestError('getActiveDealById failed', error);
      return {
        ok: false,
        error: 'database_error',
        message: mapDealsPostgrestError('Database error', error),
        code: error.code,
      };
    }

    if (data == null) {
      return {
        ok: false,
        error: 'not_found',
        message: 'Deal not found or inactive',
      };
    }

    return { ok: true, deal: data as Deal };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : 'Unexpected error loading deal';
    console.error('[DealASteal] getActiveDealById failed:', cause);
    return {
      ok: false,
      error: 'database_error',
      message,
    };
  }
}
