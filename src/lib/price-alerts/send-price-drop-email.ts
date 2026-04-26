import 'server-only';
import { escapeHtml } from '@/lib/contact/escape-html';
import { getPublicSiteBaseUrl } from '@/lib/site-base-url';
import { signPriceAlertUnsubscribeToken } from '@/lib/price-alerts/unsubscribe-token';

export type SendPriceDropEmailResult =
  | { ok: true; delivered: true }
  | { ok: true; delivered: false; reason: 'not_configured' | 'skipped_dev' }
  | { ok: false; error: string; status?: number };

function readEnv(name: string): string {
  const v = process.env[name];
  return typeof v === 'string' ? v.trim() : '';
}

type Args = {
  to: string;
  dealTitle: string;
  currentPrice: number;
  currency: string;
  thresholdPrice: number;
  dealPageUrl: string;
  priceAlertId: string;
};

/**
 * Resend: env ``RESEND_API_KEY``, ``RESEND_FROM_EMAIL``. Tags for bounce webhooks: ``price_alert_id``.
 */
export async function sendPriceDropEmail(args: Args): Promise<SendPriceDropEmailResult> {
  const apiKey = readEnv('RESEND_API_KEY');
  const from = readEnv('RESEND_FROM_EMAIL');
  const skip = process.env.NODE_ENV === 'development' && readEnv('PRICE_ALERT_EMAIL_SKIP_SEND') === '1';

  if (skip) {
    return { ok: true, delivered: false, reason: 'skipped_dev' };
  }

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === 'development') {
      return { ok: true, delivered: false, reason: 'not_configured' };
    }
    return {
      ok: false,
      error: 'Email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.',
    };
  }

  const base = getPublicSiteBaseUrl();
  let token: string;
  try {
    token = signPriceAlertUnsubscribeToken(args.priceAlertId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unsubscribe not configured' };
  }
  const unsubscribeUrl = `${base}/api/price-alerts/unsubscribe?token=${encodeURIComponent(token)}`;

  const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: args.currency,
    maximumFractionDigits: 2,
  });
  const cur = money.format(args.currentPrice);
  const thr = money.format(args.thresholdPrice);
  const safeTitle = escapeHtml(args.dealTitle);
  const safeDealUrl = escapeHtml(args.dealPageUrl);

  const subject = `Price hit your target: ${args.dealTitle.slice(0, 60)}${args.dealTitle.length > 60 ? '…' : ''}`;

  const html = [
    `<p>The deal is now <strong>${cur}</strong> (at or below your <strong>${thr}</strong> target).</p>`,
    `<p><strong>${safeTitle}</strong></p>`,
    `<p><a href="${safeDealUrl}">View the deal</a></p>`,
    `<p style="margin-top:24px;font-size:12px;color:#666">`,
    `No longer want alerts? <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe in one click</a>.`,
    `</p>`,
  ].join('');

  const text = [
    `Price alert: now ${cur} (target ${thr})`,
    '',
    args.dealTitle,
    args.dealPageUrl,
    '',
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject,
      html,
      text,
      tags: [
        { name: 'product', value: 'price_alert' },
        { name: 'price_alert_id', value: args.priceAlertId },
      ],
    }),
  });

  if (!res.ok) {
    const raw = await res.text();
    let detail = raw;
    try {
      const j = JSON.parse(raw) as { message?: string };
      if (typeof j.message === 'string') {
        detail = j.message;
      }
    } catch {
      /* keep raw */
    }
    return { ok: false, error: detail || 'Resend request failed', status: res.status };
  }

  return { ok: true, delivered: true };
}
