import { NextResponse, type NextRequest } from 'next/server';
import { Webhook } from 'svix';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/observability/logger';

export const runtime = 'nodejs';

const log = logger.child('api/webhooks/resend');

const BOUNCE_TYPES = new Set(['email.bounced', 'email.complained']);

type ResendEvent = {
  type: string;
  data?: {
    to?: string[];
    tags?: Record<string, string> | { name: string; value: string }[];
  };
};

function readTags(data: ResendEvent['data']): Record<string, string> {
  if (!data?.tags) {
    return {};
  }
  const t = data.tags;
  if (Array.isArray(t)) {
    const out: Record<string, string> = {};
    for (const entry of t) {
      if (entry && typeof entry === 'object' && 'name' in entry && 'value' in entry) {
        out[String(entry.name)] = String(entry.value);
      }
    }
    return out;
  }
  if (typeof t === 'object') {
    return t as Record<string, string>;
  }
  return {};
}

function disableAlertById(alertId: string) {
  return getSupabaseAdmin()
    .from('price_alerts')
    .update({ is_active: false, is_below_threshold: false })
    .eq('id', alertId);
}

function disableByRecipientEmail(to: string) {
  return getSupabaseAdmin()
    .from('price_alerts')
    .update({ is_active: false, is_below_threshold: false })
    .eq('notify_email', to);
}

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim() ?? '';
  const body = await request.text();
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      // Dev: parse JSON without verify for local webhooks; production must set secret.
      let payload: ResendEvent;
      try {
        payload = JSON.parse(body) as ResendEvent;
      } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
      }
      if (!BOUNCE_TYPES.has(payload.type)) {
        return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
      }
      return await handleBounceEvent(payload);
    }
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const id = request.headers.get('svix-id');
  const ts = request.headers.get('svix-timestamp');
  const sig = request.headers.get('svix-signature');
  if (!id || !ts || !sig) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 });
  }
  let payload: ResendEvent;
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(body, { 'svix-id': id, 'svix-timestamp': ts, 'svix-signature': sig }) as ResendEvent;
  } catch (e) {
    log.error('webhook verify failed', { err: e instanceof Error ? e.message : 'err' });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  if (!BOUNCE_TYPES.has(payload.type)) {
    return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
  }
  return await handleBounceEvent(payload);
}

async function handleBounceEvent(payload: ResendEvent) {
  const data = payload.data;
  const tags = readTags(data);
  const alertId = tags.price_alert_id;
  if (typeof alertId === 'string' && alertId.length > 0) {
    const { error } = await disableAlertById(alertId);
    if (error) {
      log.error('disable alert by id', { err: error.message });
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, disabled: 'by_id' }, { status: 200 });
  }
  const to0 = data?.to?.[0];
  if (to0) {
    const { error } = await disableByRecipientEmail(to0);
    if (error) {
      log.error('disable alert by email', { err: error.message });
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, disabled: 'by_email' }, { status: 200 });
  }
  return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
}
