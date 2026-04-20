import { getSupabaseServerAnon } from '@/lib/supabase/server';
import type { Deal, CouponDiscountType } from '@/types/database.types';

const DEAL_SELECT =
  'id, merchant_id, title, description, original_price, discount_price, discount_percentage, affiliate_url, image_url, is_loot_deal, is_active, expires_at, created_at, category_slug';

export interface DealWithCoupon extends Deal {
  coupon_code: string;
  coupon_discount_type: CouponDiscountType;
  coupon_discount_value: number;
}

export interface SectionResult {
  deals: Deal[];
  total: number;
}

/** Deals expiring within the next 7 days, ordered by soonest expiry first. */
export async function getExpiringDeals(limit = 20): Promise<Deal[]> {
  try {
    const supabase = getSupabaseServerAnon();
    const now = new Date().toISOString();
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('deals')
      .select(DEAL_SELECT)
      .eq('is_active', true)
      .not('expires_at', 'is', null)
      .gt('expires_at', now)
      .lt('expires_at', weekFromNow)
      .order('expires_at', { ascending: true })
      .limit(limit);
    return (data ?? []) as Deal[];
  } catch {
    return [];
  }
}

/** Active deals that have an associated active coupon code. */
export async function getCouponDeals(limit = 16): Promise<DealWithCoupon[]> {
  try {
    const supabase = getSupabaseServerAnon();
    const { data } = await supabase
      .from('coupons')
      .select(`code, discount_type, discount_value, deal:deals!inner(${DEAL_SELECT})`)
      .eq('is_active', true)
      .not('deal_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data
      .filter((row) => {
        const d = (row as Record<string, unknown>).deal as Record<string, unknown> | null;
        return d && d.is_active === true;
      })
      .map((row) => {
        const r = row as Record<string, unknown>;
        const deal = r.deal as Deal;
        return {
          ...deal,
          coupon_code: r.code as string,
          coupon_discount_type: r.discount_type as CouponDiscountType,
          coupon_discount_value: r.discount_value as number,
        };
      });
  } catch {
    return [];
  }
}

/** Deals with highest discount percentage (≥ 40 %). */
export async function getTopDeals(
  opts: { limit?: number; offset?: number } = {}
): Promise<SectionResult> {
  const { limit = 6, offset = 0 } = opts;
  try {
    const supabase = getSupabaseServerAnon();
    const { data, count } = await supabase
      .from('deals')
      .select(DEAL_SELECT, { count: 'exact' })
      .eq('is_active', true)
      .gte('discount_percentage', 40)
      .order('discount_percentage', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    const topDeals = (data ?? []) as Deal[];
    if (topDeals.length > 0 || (count ?? 0) > 0) {
      return { deals: topDeals, total: count ?? 0 };
    }

    // Fallback: keep section populated even when no deal passes the strict threshold.
    const fallback = await supabase
      .from('deals')
      .select(DEAL_SELECT, { count: 'exact' })
      .eq('is_active', true)
      .order('discount_percentage', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return { deals: (fallback.data ?? []) as Deal[], total: fallback.count ?? 0 };
  } catch {
    return { deals: [], total: 0 };
  }
}

/** Loot/hot deals: is_loot_deal = true, ordered newest first. */
export async function getHotDeals(
  opts: { limit?: number; offset?: number } = {}
): Promise<SectionResult> {
  const { limit = 6, offset = 0 } = opts;
  try {
    const supabase = getSupabaseServerAnon();
    const { data, count } = await supabase
      .from('deals')
      .select(DEAL_SELECT, { count: 'exact' })
      .eq('is_active', true)
      .eq('is_loot_deal', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    const hotDeals = (data ?? []) as Deal[];
    if (hotDeals.length > 0 || (count ?? 0) > 0) {
      return { deals: hotDeals, total: count ?? 0 };
    }

    // Fallback: keep Hot section alive with recent active deals.
    const fallback = await supabase
      .from('deals')
      .select(DEAL_SELECT, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return { deals: (fallback.data ?? []) as Deal[], total: fallback.count ?? 0 };
  } catch {
    return { deals: [], total: 0 };
  }
}

/** All active deals ordered newest first with offset pagination. */
export async function getLatestDeals(
  opts: { page?: number; pageSize?: number } = {}
): Promise<SectionResult> {
  const { page = 1, pageSize = 36 } = opts;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  try {
    const supabase = getSupabaseServerAnon();
    const { data, count } = await supabase
      .from('deals')
      .select(DEAL_SELECT, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    return { deals: (data ?? []) as Deal[], total: count ?? 0 };
  } catch {
    return { deals: [], total: 0 };
  }
}
