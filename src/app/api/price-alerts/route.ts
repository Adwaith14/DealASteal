import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { initialIsBelow } from '@/lib/price-alerts/transition';
import { logger } from '@/lib/observability/logger';

export const runtime = 'nodejs';

const log = logger.child('api/price-alerts');

const postBody = z.object({
  dealId: z.string().uuid(),
  thresholdPrice: z.number().positive().finite(),
});

/**
 * `GET ?dealId=uuid` — own active alert for a deal, or 404/empty.
 */
export async function GET(request: NextRequest) {
  const dealId = request.nextUrl.searchParams.get('dealId');
  if (!dealId || !z.string().uuid().safeParse(dealId).success) {
    return NextResponse.json({ error: 'Invalid dealId' }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data, error } = await supabase
    .from('price_alerts')
    .select('id, threshold_price, is_active, created_at')
    .eq('user_id', user.id)
    .eq('deal_id', dealId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) {
    log.error('get price alert', { err: error.message });
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
  return NextResponse.json({ alert: data });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = postBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const email = user.email?.trim();
  if (!email) {
    return NextResponse.json({ error: 'No email on account' }, { status: 400 });
  }

  const { dealId, thresholdPrice } = parsed.data;
  const { data: deal, error: dealErr } = await supabase
    .from('deals')
    .select('id, discount_price, currency, is_active')
    .eq('id', dealId)
    .single();
  if (dealErr || !deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }
  if (!deal.is_active) {
    return NextResponse.json({ error: 'Deal not active' }, { status: 400 });
  }

  const isBelow = initialIsBelow({ currentPrice: deal.discount_price, thresholdPrice });
  const currency = (typeof deal.currency === 'string' && deal.currency.length >= 2
    ? deal.currency
    : 'USD'
  ).slice(0, 3);

  const { data: row, error: upErr } = await supabase
    .from('price_alerts')
    .upsert(
      {
        user_id: user.id,
        deal_id: dealId,
        threshold_price: thresholdPrice,
        currency,
        notify_email: email,
        is_active: true,
        is_below_threshold: isBelow,
      },
      { onConflict: 'user_id,deal_id' }
    )
    .select('id, threshold_price')
    .single();
  if (upErr) {
    log.error('upsert price alert', { err: upErr.message });
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
  return NextResponse.json({ id: row.id, thresholdPrice: row.threshold_price }, { status: 201 });
}

/**
 * `DELETE ?id=uuid` — user removes an alert.
 */
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { error } = await supabase.from('price_alerts').delete().eq('id', id).eq('user_id', user.id);
  if (error) {
    log.error('delete price alert', { err: error.message });
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
