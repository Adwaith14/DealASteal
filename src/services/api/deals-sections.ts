import 'server-only';
import { unstable_cache } from 'next/cache';
import { dealSelectColumnsForPostgrest, dealsDbHasAdminSchema } from '@/lib/catalog/deals-db-schema';
import { DEALS_UNAVAILABLE_WITHOUT_PUBLIC_SUPABASE } from '@/lib/supabase/deals-db-unavailable-message';
import { getSupabaseServerAnon } from '@/lib/supabase/server';
import type { Deal, CouponDiscountType } from '@/types/database.types';
import { logPostgrestError } from './log-postgrest-error';
import { mapDealsPostgrestError } from './map-deals-postgrest-user-message';

export interface DealWithCoupon extends Deal {
  coupon_code: string;
  coupon_discount_type: CouponDiscountType;
  coupon_discount_value: number;
}

export interface SectionResult {
  deals: Deal[];
  total: number;
  /** When Supabase returned an error; ``deals`` will be empty. */
  fetchError?: string;
}

export type ExpiringSectionResult = { deals: Deal[]; fetchError?: string };
export type CouponSectionResult = { deals: DealWithCoupon[]; fetchError?: string };

export type CuratedSortMode = 'popular' | 'newest' | 'biggest_drop';

export type CuratedSectionResult = { deals: Deal[]; fetchError?: string };

/**
 * Curated grid: `newest` by `created_at`; `biggest_drop` by `discount_percentage`;
 * `popular` uses loot flag + discount + recency (no separate popularity metric in schema).
 */
export const getCuratedDeals = unstable_cache(
  async (
    sort: CuratedSortMode,
    limit = 6
  ): Promise<CuratedSectionResult> => {
  try {
    const supabase = getSupabaseServerAnon();
    if (!supabase) {
      return { deals: [], fetchError: DEALS_UNAVAILABLE_WITHOUT_PUBLIC_SUPABASE };
    }
    let q = supabase.from('deals').select(dealSelectColumnsForPostgrest()).eq('is_active', true);
    if (sort === 'newest') {
      q = q.order('created_at', { ascending: false });
    } else if (sort === 'biggest_drop') {
      q = q
        .order('discount_percentage', { ascending: false })
        .order('created_at', { ascending: false });
    } else {
      q = q
        .order('is_loot_deal', { ascending: false })
        .order('discount_percentage', { ascending: false })
        .order('created_at', { ascending: false });
    }
    if (dealsDbHasAdminSchema()) {
      q = q.order('admin_pinned_at', { ascending: false, nullsFirst: false });
    }
    const { data, error } = await q.limit(limit);
    if (error) {
      logPostgrestError('getCuratedDeals', error);
      return {
        deals: [],
        fetchError: mapDealsPostgrestError('Could not load curated deals', error),
      };
    }
    return { deals: (data ?? []) as unknown as Deal[] };
  } catch {
    return { deals: [] };
  }
}, ['deals-curated'], { revalidate: 300 });

export type BestDealOfDayResult = {
  deal: Deal | null;
  fetchError?: string;
};

/** Deals expiring within the next 7 days, ordered by soonest expiry first. */
export const getExpiringDeals = unstable_cache(
  async (limit = 20): Promise<ExpiringSectionResult> => {
  try {
    const supabase = getSupabaseServerAnon();
    if (!supabase) {
      return { deals: [], fetchError: DEALS_UNAVAILABLE_WITHOUT_PUBLIC_SUPABASE };
    }
    const now = new Date().toISOString();
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    let expQ = supabase
      .from('deals')
      .select(dealSelectColumnsForPostgrest())
      .eq('is_active', true)
      .not('expires_at', 'is', null)
      .gt('expires_at', now)
      .lt('expires_at', weekFromNow);
    if (dealsDbHasAdminSchema()) {
      expQ = expQ.order('admin_pinned_at', { ascending: false, nullsFirst: false });
    }
    const { data, error } = await expQ.order('expires_at', { ascending: true }).limit(limit);
    if (error) {
      logPostgrestError('getExpiringDeals', error);
      return {
        deals: [],
        fetchError: mapDealsPostgrestError('Could not load expiring deals', error),
      };
    }
    return { deals: (data ?? []) as unknown as Deal[] };
  } catch {
    return { deals: [] };
  }
}, ['deals-expiring'], { revalidate: 300 });

/** Active deals that have an associated active coupon code. */
export async function getCouponDeals(limit = 16): Promise<CouponSectionResult> {
  try {
    const supabase = getSupabaseServerAnon();
    if (!supabase) {
      return { deals: [], fetchError: DEALS_UNAVAILABLE_WITHOUT_PUBLIC_SUPABASE };
    }
    const { data, error } = await supabase
      .from('coupons')
      .select(
        `code, discount_type, discount_value, deal:deals!inner(${dealSelectColumnsForPostgrest()})`
      )
      .eq('is_active', true)
      .not('deal_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logPostgrestError('getCouponDeals', error);
      return {
        deals: [],
        fetchError: mapDealsPostgrestError('Could not load coupon deals', error),
      };
    }
    if (!data) return { deals: [] };

    return {
      deals: data
        .filter((row) => {
          const d = (row as unknown as Record<string, unknown>).deal as Record<string, unknown> | null;
          return d && d.is_active === true;
        })
        .map((row) => {
          const r = row as unknown as Record<string, unknown>;
          const deal = r.deal as Deal;
          return {
            ...deal,
            coupon_code: r.code as string,
            coupon_discount_type: r.discount_type as CouponDiscountType,
            coupon_discount_value: r.discount_value as number,
          };
        }),
    };
  } catch {
    return { deals: [] };
  }
}

/** Deals with highest discount percentage (≥ 40 %). */
export const getTopDeals = unstable_cache(
  async (
    opts: { limit?: number; offset?: number } = {}
  ): Promise<SectionResult> => {
  const { limit = 6, offset = 0 } = opts;
  try {
    const supabase = getSupabaseServerAnon();
    if (!supabase) {
      return {
        deals: [],
        total: 0,
        fetchError: DEALS_UNAVAILABLE_WITHOUT_PUBLIC_SUPABASE,
      };
    }
    const { data, count, error } = await supabase
      .from('deals')
      .select(dealSelectColumnsForPostgrest(), { count: 'exact' })
      .eq('is_active', true)
      .gte('discount_percentage', 40)
      .order('discount_percentage', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) {
      logPostgrestError('getTopDeals (strict)', error);
      return {
        deals: [],
        total: 0,
        fetchError: mapDealsPostgrestError('Could not load top deals', error),
      };
    }
    const topDeals = (data ?? []) as unknown as Deal[];
    if (topDeals.length > 0 || (count ?? 0) > 0) {
      return { deals: topDeals, total: count ?? 0 };
    }

    // Fallback: keep section populated even when no deal passes the strict threshold.
    let fbQ = supabase.from('deals').select(dealSelectColumnsForPostgrest(), { count: 'exact' }).eq('is_active', true);
    if (dealsDbHasAdminSchema()) {
      fbQ = fbQ.order('admin_pinned_at', { ascending: false, nullsFirst: false });
    }
    const fallback = await fbQ
      .order('discount_percentage', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (fallback.error) {
      logPostgrestError('getTopDeals (fallback)', fallback.error);
      return {
        deals: [],
        total: 0,
        fetchError: mapDealsPostgrestError('Could not load top deals', fallback.error),
      };
    }
    return { deals: (fallback.data ?? []) as unknown as Deal[], total: fallback.count ?? 0 };
  } catch {
    return { deals: [], total: 0 };
  }
}, ['deals-top'], { revalidate: 300 });

/** Loot/hot deals: is_loot_deal = true, ordered newest first. */
export async function getHotDeals(
  opts: { limit?: number; offset?: number } = {}
): Promise<SectionResult> {
  const { limit = 6, offset = 0 } = opts;
  try {
    const supabase = getSupabaseServerAnon();
    if (!supabase) {
      return {
        deals: [],
        total: 0,
        fetchError: DEALS_UNAVAILABLE_WITHOUT_PUBLIC_SUPABASE,
      };
    }
    let hotQ = supabase
      .from('deals')
      .select(dealSelectColumnsForPostgrest(), { count: 'exact' })
      .eq('is_active', true)
      .eq('is_loot_deal', true);
    if (dealsDbHasAdminSchema()) {
      hotQ = hotQ.order('admin_pinned_at', { ascending: false, nullsFirst: false });
    }
    const { data, count, error } = await hotQ.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) {
      logPostgrestError('getHotDeals (loot)', error);
      return {
        deals: [],
        total: 0,
        fetchError: mapDealsPostgrestError('Could not load hot deals', error),
      };
    }
    const hotDeals = (data ?? []) as unknown as Deal[];
    if (hotDeals.length > 0 || (count ?? 0) > 0) {
      return { deals: hotDeals, total: count ?? 0 };
    }

    // Fallback: keep Hot section alive with recent active deals.
    let hotFb = supabase.from('deals').select(dealSelectColumnsForPostgrest(), { count: 'exact' }).eq('is_active', true);
    if (dealsDbHasAdminSchema()) {
      hotFb = hotFb.order('admin_pinned_at', { ascending: false, nullsFirst: false });
    }
    const fallback = await hotFb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (fallback.error) {
      logPostgrestError('getHotDeals (fallback)', fallback.error);
      return {
        deals: [],
        total: 0,
        fetchError: mapDealsPostgrestError('Could not load hot deals', fallback.error),
      };
    }
    return { deals: (fallback.data ?? []) as unknown as Deal[], total: fallback.count ?? 0 };
  } catch {
    return { deals: [], total: 0 };
  }
}

/**
 * Top scored row from ``best_deals_today`` (materialised view), hydrated with a full ``deals`` row.
 * Requires migration ``20260427153000_deal_scoring_job.sql`` + periodic ``refresh_deal_scores``.
 */
export const getBestDealOfDay = unstable_cache(
  async (): Promise<BestDealOfDayResult> => {
  try {
    const supabase = getSupabaseServerAnon();
    if (!supabase) {
      return { deal: null, fetchError: DEALS_UNAVAILABLE_WITHOUT_PUBLIC_SUPABASE };
    }

    const { data: head, error: mvError } = await supabase
      .from('best_deals_today')
      .select('id')
      .order('score', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (mvError) {
      logPostgrestError('getBestDealOfDay (best_deals_today)', mvError);
      return {
        deal: null,
        fetchError: mapDealsPostgrestError('Could not load best deal', mvError),
      };
    }

    const id = head && typeof head === 'object' && 'id' in head ? (head as { id: string }).id : null;
    if (!id) {
      return { deal: null };
    }

    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(dealSelectColumnsForPostgrest())
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();

    if (dealError) {
      logPostgrestError('getBestDealOfDay (deals)', dealError);
      return {
        deal: null,
        fetchError: mapDealsPostgrestError('Could not load best deal', dealError),
      };
    }

    return { deal: (deal ?? null) as Deal | null };
  } catch {
    return { deal: null };
  }
}, ['deals-best-of-day'], { revalidate: 300 });

/** All active deals ordered newest first with offset pagination. */
export async function getLatestDeals(
  opts: { page?: number; pageSize?: number } = {}
): Promise<SectionResult> {
  const { page = 1, pageSize = 36 } = opts;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  try {
    const supabase = getSupabaseServerAnon();
    if (!supabase) {
      return {
        deals: [],
        total: 0,
        fetchError: DEALS_UNAVAILABLE_WITHOUT_PUBLIC_SUPABASE,
      };
    }
    let latQ = supabase.from('deals').select(dealSelectColumnsForPostgrest(), { count: 'exact' }).eq('is_active', true);
    if (dealsDbHasAdminSchema()) {
      latQ = latQ.order('admin_pinned_at', { ascending: false, nullsFirst: false });
    }
    const { data, count, error } = await latQ.order('created_at', { ascending: false }).range(from, to);
    if (error) {
      logPostgrestError('getLatestDeals', error);
      return {
        deals: [],
        total: 0,
        fetchError: mapDealsPostgrestError('Could not load latest deals', error),
      };
    }
    return { deals: (data ?? []) as unknown as Deal[], total: count ?? 0 };
  } catch {
    return { deals: [], total: 0 };
  }
}
