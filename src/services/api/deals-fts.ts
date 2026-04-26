import 'server-only';

import type { DealSortKey, DealStoreFilterKey } from '@/constants/deal-browse-filters';
import { DEAL_STORE_URL_NEEDLES } from '@/constants/deal-browse-filters';
import { logger } from '@/lib/observability/logger';
import { getSupabaseServerAnon } from '@/lib/supabase/server';
import type { Deal } from '@/types/database.types';

import type { ActiveDealsFetchSuccess } from './deals';

const log = logger.child('catalog:fts');

function normalizeRpcJson(raw: unknown): unknown {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }
  return raw;
}

type RpcPayload = {
  total: string | number;
  deals: unknown;
};

function parseRpcPayload(raw: unknown): { total: number; deals: Deal[] } | null {
  const normalized = normalizeRpcJson(raw);
  if (normalized == null || typeof normalized !== 'object') {
    return null;
  }
  const o = normalized as RpcPayload;
  const total = typeof o.total === 'number' ? o.total : Number.parseInt(String(o.total), 10);
  if (!Number.isFinite(total) || total < 0) {
    return null;
  }
  if (!Array.isArray(o.deals)) {
    return null;
  }
  return { total, deals: o.deals as unknown as Deal[] };
}

export type ActiveDealsFtsArgs = {
  query: string;
  page: number;
  pageSize: number;
  categorySlug: string | null;
  storeKey: DealStoreFilterKey | null;
  minDiscount: number | null;
  maxPrice: number | null;
  lootOnly: boolean;
  sortKey: DealSortKey;
};

/**
 * Ranked full-text search via ``search_active_deals_fts`` (Phase 17).
 * Returns null when RPC is unavailable or the payload is malformed (caller falls back to ILIKE).
 */
export async function tryFetchActiveDealsFts(
  args: ActiveDealsFtsArgs
): Promise<ActiveDealsFetchSuccess | null> {
  const supabase = getSupabaseServerAnon();
  if (!supabase) {
    return null;
  }

  const rowOffset = (args.page - 1) * args.pageSize;

  const { data, error } = await supabase.rpc('search_active_deals_fts', {
    p_q: args.query.trim(),
    p_category_slug: args.categorySlug,
    p_affiliate_url_pattern: args.storeKey ? DEAL_STORE_URL_NEEDLES[args.storeKey] : null,
    p_min_discount: args.minDiscount,
    p_max_price: args.maxPrice,
    p_loot_only: args.lootOnly,
    p_sort: args.sortKey,
    p_limit: args.pageSize,
    p_offset: rowOffset,
  });

  if (error) {
    log.warn('search_active_deals_fts failed; caller may fall back to ILIKE', {
      message: error.message,
      code: error.code,
    });
    return null;
  }

  const parsed = parseRpcPayload(data);
  if (!parsed) {
    log.warn('search_active_deals_fts returned unexpected shape');
    return null;
  }

  const deals = parsed.deals;
  const totalCount = parsed.total;
  const totalPages = Math.max(1, Math.ceil(totalCount / args.pageSize));

  return {
    ok: true,
    deals,
    page: args.page,
    pageSize: args.pageSize,
    totalCount,
    totalPages,
    appliedQuery: args.query.trim(),
    appliedCategorySlug: args.categorySlug,
    appliedStore: args.storeKey,
    appliedMinDiscount: args.minDiscount,
    appliedMaxPrice: args.maxPrice,
    appliedLootOnly: args.lootOnly,
    appliedSort: args.sortKey,
  };
}
