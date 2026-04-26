import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { evaluatePriceAlertStep } from '@/lib/price-alerts/transition';
import { sendPriceDropEmail } from '@/lib/price-alerts/send-price-drop-email';
import { sendPriceAlertWebPushes } from '@/lib/push/price-alert-web-push';
import { getPublicSiteBaseUrl } from '@/lib/site-base-url';
import { logger } from '@/lib/observability/logger';

const log = logger.child('price-alerts.cron');

type AlertRow = {
  id: string;
  user_id: string;
  deal_id: string;
  threshold_price: number;
  is_below_threshold: boolean;
  currency: string;
  notify_email: string;
  deals: {
    id: string;
    discount_price: number;
    title: string;
    is_active: boolean;
    currency: string | null;
  } | null;
};

export type RunPriceAlertCronResult = {
  checked: number;
  notified: number;
  pushSent: number;
  pushErrors: number;
  errors: number;
  skipped: number;
};

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Batches all active alerts, uses latest `price_history.price` per deal when
 * present, else `deals.discount_price`, then applies crossing + Resend.
 */
export async function runPriceAlertCron(): Promise<RunPriceAlertCronResult> {
  const admin = getSupabaseAdmin();
  const { data: rows, error: loadErr } = await admin
    .from('price_alerts')
    .select(
      'id, user_id, deal_id, threshold_price, is_below_threshold, currency, notify_email, deals!inner ( id, discount_price, title, is_active, currency )'
    )
    .eq('is_active', true);

  if (loadErr) {
    log.error('load price_alerts failed', { err: loadErr.message });
    throw new Error(loadErr.message);
  }

  const list = (rows ?? []) as unknown as AlertRow[];
  if (list.length === 0) {
    return { checked: 0, notified: 0, pushSent: 0, pushErrors: 0, errors: 0, skipped: 0 };
  }

  const dealIds = [...new Set(list.map((r) => r.deal_id))];
  const { data: phRows, error: phErr } = await admin
    .from('price_history')
    .select('deal_id, price, recorded_at')
    .in('deal_id', dealIds)
    .order('recorded_at', { ascending: false });

  if (phErr) {
    log.error('load price_history failed', { err: phErr.message });
    throw new Error(phErr.message);
  }

  const latestPh = new Map<string, number>();
  for (const r of phRows ?? []) {
    if (!latestPh.has(r.deal_id)) {
      latestPh.set(r.deal_id, r.price);
    }
  }

  const base = getPublicSiteBaseUrl();
  let notified = 0;
  let pushSent = 0;
  let pushErrors = 0;
  let errors = 0;
  let skipped = 0;

  for (const a of list) {
    const raw = a.deals;
    const d = Array.isArray(raw) ? raw[0] : raw;
    if (!d || !d.is_active) {
      skipped += 1;
      continue;
    }
    const current =
      latestPh.get(a.deal_id) != null
        ? (latestPh.get(a.deal_id) as number)
        : d.discount_price;
    if (typeof current !== 'number' || !Number.isFinite(current)) {
      skipped += 1;
      continue;
    }
    const currency = (a.currency || d.currency || 'USD').slice(0, 3) || 'USD';
    const step = evaluatePriceAlertStep({
      thresholdPrice: a.threshold_price,
      currentPrice: current,
      isBelowThreshold: a.is_below_threshold,
    });
    if (!step.shouldNotify) {
      if (step.nextIsBelowThreshold !== a.is_below_threshold) {
        const { error: upErr } = await admin
          .from('price_alerts')
          .update({ is_below_threshold: step.nextIsBelowThreshold })
          .eq('id', a.id);
        if (upErr) {
          errors += 1;
          log.error('update is_below without notify failed', { id: a.id, err: upErr.message });
        }
      }
      continue;
    }

    const dealPageUrl = `${base}/deals/${d.id}`;
    const send = await sendPriceDropEmail({
      to: a.notify_email,
      dealTitle: d.title,
      currentPrice: current,
      currency,
      thresholdPrice: a.threshold_price,
      dealPageUrl,
      priceAlertId: a.id,
    });
    if (!send.ok) {
      errors += 1;
      log.error('resend price alert failed', { id: a.id, err: send.error });
      continue;
    }
    const { error: upErr2 } = await admin
      .from('price_alerts')
      .update({
        is_below_threshold: step.nextIsBelowThreshold,
        last_fired_at: new Date().toISOString(),
      })
      .eq('id', a.id);
    if (upErr2) {
      errors += 1;
      log.error('update after price alert send failed', { id: a.id, err: upErr2.message });
      continue;
    }
    notified += 1;

    const push = await sendPriceAlertWebPushes(a.user_id, {
      title: 'Price hit your target',
      body: `${d.title.slice(0, 72)}${d.title.length > 72 ? '…' : ''} — now ${formatMoney(current, currency)}`,
      url: dealPageUrl,
      tag: `price-alert:${a.id}`,
    });
    pushSent += push.sent;
    pushErrors += push.errors;
  }

  return { checked: list.length, notified, pushSent, pushErrors, errors, skipped };
}
