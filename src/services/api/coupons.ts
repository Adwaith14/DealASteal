import 'server-only';
import { DEALS_UNAVAILABLE_WITHOUT_PUBLIC_SUPABASE } from '@/lib/supabase/deals-db-unavailable-message';
import { getSupabaseServerAnon } from '@/lib/supabase/server';
import type { Coupon } from '@/types/database.types';
import { logPostgrestError } from './log-postgrest-error';
import { mapDealsPostgrestError } from './map-deals-postgrest-user-message';

export type ApplicableCouponsResult =
  | { ok: true; coupons: Coupon[] }
  | { ok: false; coupons: []; error: string };

/**
 * Coupons applicable to a deal:
 * 1) direct deal coupons, and
 * 2) merchant-wide coupons (`deal_id is null`).
 * Expired rows are hidden by RLS policy.
 */
export async function getApplicableCouponsForDeal(
  dealId: string,
  merchantId: string
): Promise<ApplicableCouponsResult> {
  try {
    const supabase = getSupabaseServerAnon();
    if (!supabase) {
      return { ok: false, coupons: [], error: DEALS_UNAVAILABLE_WITHOUT_PUBLIC_SUPABASE };
    }

    const { data, error } = await supabase
      .from('coupons')
      .select(
        'id, merchant_id, deal_id, code, title, description, discount_type, discount_value, affiliate_url, expires_at, is_active, created_at, updated_at'
      )
      .eq('is_active', true)
      .or(`deal_id.eq.${dealId},and(deal_id.is.null,merchant_id.eq.${merchantId})`)
      .order('deal_id', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      logPostgrestError('getApplicableCouponsForDeal', error);
      return {
        ok: false,
        coupons: [],
        error: mapDealsPostgrestError('Could not load coupons', error),
      };
    }

    return { ok: true, coupons: (data ?? []) as Coupon[] };
  } catch {
    return { ok: false, coupons: [], error: 'Could not load coupons' };
  }
}
