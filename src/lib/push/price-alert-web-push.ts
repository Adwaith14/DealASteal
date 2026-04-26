import 'server-only';

import webpush from 'web-push';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/observability/logger';

const log = logger.child('price-alerts.web-push');

export type PriceAlertWebPushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

function ensureVapidConfigured(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_MAILTO?.trim() || 'mailto:security@dealasteal.invalid';
  if (!publicKey || !privateKey) {
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

type PushRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Sends a Web Push to every stored subscription for the user. Best-effort:
 * invalid endpoints (410/404) are deleted. No-ops when VAPID is not configured.
 */
export async function sendPriceAlertWebPushes(
  userId: string,
  payload: PriceAlertWebPushPayload
): Promise<{ sent: number; errors: number }> {
  if (!ensureVapidConfigured()) {
    return { sent: 0, errors: 0 };
  }

  const admin = getSupabaseAdmin();
  const { data: rows, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error) {
    log.error('load push_subscriptions failed', { err: error.message, userId });
    return { sent: 0, errors: 1 };
  }

  const list = (rows ?? []) as PushRow[];
  if (list.length === 0) {
    return { sent: 0, errors: 0 };
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    tag: payload.tag,
  });

  let sent = 0;
  let errors = 0;

  for (const row of list) {
    const subscription = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };
    try {
      await webpush.sendNotification(subscription, body, { TTL: 60 * 60 * 12 });
      sent += 1;
    } catch (e: unknown) {
      const status = typeof e === 'object' && e !== null && 'statusCode' in e ? (e as { statusCode?: number }).statusCode : undefined;
      if (status === 404 || status === 410) {
        const { error: delErr } = await admin.from('push_subscriptions').delete().eq('id', row.id);
        if (delErr) {
          log.warn('delete stale push subscription failed', { id: row.id, err: delErr.message });
        }
        continue;
      }
      errors += 1;
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('web push send failed', { id: row.id, status, err: msg });
    }
  }

  return { sent, errors };
}
