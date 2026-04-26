import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { verifyPriceAlertUnsubscribeToken } from '@/lib/price-alerts/unsubscribe-token';
import { logger } from '@/lib/observability/logger';

export const runtime = 'nodejs';

const log = logger.child('api/price-alerts/unsubscribe');

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim() ?? '';
  const alertId = verifyPriceAlertUnsubscribeToken(token);
  if (!alertId) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
  }
  const { error } = await getSupabaseAdmin()
    .from('price_alerts')
    .update({ is_active: false, is_below_threshold: false })
    .eq('id', alertId);
  if (error) {
    log.error('unsubscribe update', { err: error.message });
    return NextResponse.json({ error: 'Could not update' }, { status: 500 });
  }
  const home = new URL('/', request.nextUrl);
  home.searchParams.set('priceAlert', 'off');
  return NextResponse.redirect(home);
}
