import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { logger } from '@/lib/observability/logger';
import { callerIdentity, createInMemoryRateLimiter } from '@/lib/security/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getActiveDealById } from '@/services/api/deals';

export const runtime = 'nodejs';

/**
 * Outbound affiliate-click bouncer.
 *
 * Why we own this redirect rather than ``href``-ing the affiliate URL:
 *   - Lets us record click telemetry in ``click_events`` for the scoring job.
 *   - Lets us strip / inject affiliate tags consistently across the site.
 *   - Lets us validate the affiliate URL once (already gate-kept by Zod on
 *     ingest, re-checked here) and refuse anything that fails.
 *   - Lets us throttle abuse (bots, scraping our own catalogue).
 *
 * The handler always returns a 302 so users get to the merchant promptly,
 * even when click logging fails. Logging is best-effort, never blocking.
 */

const clickLimiter = createInMemoryRateLimiter({
  // Generous: a real user can click 30+ links/min while exploring the site.
  capacity: 200,
  windowMs: 60_000,
});

const log = logger.child('api/click');

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sha256(value: string | null | undefined): string | null {
  if (!value) return null;
  return createHash('sha256').update(value).digest('hex');
}

function isAllowedAffiliateUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    return Boolean(url.hostname);
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  const verdict = clickLimiter.consume(callerIdentity(request.headers));
  if (!verdict.ok) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
  }

  const result = await getActiveDealById(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error === 'not_found' ? 404 : 500 });
  }

  const target = result.deal.affiliate_url;
  if (!isAllowedAffiliateUrl(target)) {
    log.warn('blocked outbound URL', { dealId: id });
    return NextResponse.json({ error: 'invalid_affiliate_url' }, { status: 422 });
  }

  // Best-effort click logging: we never block the redirect on the insert.
  void recordClick({
    dealId: id,
    headers: request.headers,
  }).catch((cause) => {
    log.warn('click insert failed', {
      message: cause instanceof Error ? cause.message : 'unknown',
    });
  });

  return NextResponse.redirect(target, { status: 302 });
}

async function recordClick({
  dealId,
  headers,
}: {
  dealId: string;
  headers: Headers;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    null;
  const ua = headers.get('user-agent');
  const referrer = headers.get('referer');
  const country = headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || null;

  await supabase.from('click_events').insert({
    deal_id: dealId,
    ip_hash: sha256(ip),
    ua_hash: sha256(ua),
    referrer: referrer?.slice(0, 500) ?? null,
    country,
  });
}
