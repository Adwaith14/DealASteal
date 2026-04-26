import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { stripV2DealInsertColumns } from '@/lib/catalog/deals-db-schema';
import { buildDealInsertRow, type DealInsertRow } from '@/lib/ingest/build-deal-insert';
import { isValidIngestionAuth } from '@/lib/ingest/verify-ingestion-auth';
import { withIngestRootSpan } from '@/lib/observability/ingest-tracing';
import { logger } from '@/lib/observability/logger';
import { captureServerEvent } from '@/lib/observability/posthog-server';
import { measureSlo } from '@/lib/observability/slo-emit';
import { callerIdentity, createRateLimiterFromEnv } from '@/lib/security/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { Deal } from '@/types/database.types';
import { DealIngestSchema } from '@/types/schemas';

/** Uses `node:crypto` and Node buffers in auth + Supabase admin client — keep off the Edge runtime. */
export const runtime = 'nodejs';

/** Conservative cap: full payload includes trust_bundle + description; should never approach 64 KB. */
const MAX_BODY_BYTES = 64 * 1024;

/**
 * 60 valid ingest writes per minute per caller (key OR IP). The bucket is in
 * memory; ``docs/architecture.md`` explains how to swap for Upstash/Redis at
 * scale-out. We always check auth FIRST so unauthenticated callers can't even
 * burn a bucket slot — they hit the 401 path instead.
 */
const ingestLimiter = createRateLimiterFromEnv({ id: 'ingest-deals', capacity: 60, windowMs: 60_000 });

const log = logger.child('api/ingest/deals');

function tooLarge(): NextResponse {
  return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
}

async function readJsonWithCap(request: NextRequest): Promise<
  { ok: true; body: unknown } | { ok: false; response: NextResponse }
> {
  const contentLength = request.headers.get('content-length');
  if (contentLength != null) {
    const n = Number.parseInt(contentLength, 10);
    if (Number.isFinite(n) && n > MAX_BODY_BYTES) {
      return { ok: false, response: tooLarge() };
    }
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return { ok: false, response: tooLarge() };
  }
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) };
  }
}

async function handleIngestPost(request: NextRequest): Promise<NextResponse> {
  try {
    if (!isValidIngestionAuth(request, process.env.INGESTION_API_KEY)) {
      log.warn('ingest auth denied', { caller: callerIdentity(request.headers) });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verdict = await ingestLimiter.consume(callerIdentity(request.headers));
    if (!verdict.ok) {
      log.warn('ingest rate limited', { resetAt: verdict.resetAt });
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.max(1, Math.ceil((verdict.resetAt - Date.now()) / 1000)).toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor(verdict.resetAt / 1000).toString(),
          },
        }
      );
    }

    const read = await readJsonWithCap(request);
    if (!read.ok) return read.response;

    const parsed = DealIngestSchema.safeParse(read.body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const validatedData = buildDealInsertRow(parsed.data);
    const { discount_percentage: _generatedPct, ...insertPayload } =
      validatedData as DealInsertRow;
    const rowForDb = stripV2DealInsertColumns(insertPayload as Record<string, unknown>) as Omit<
      DealInsertRow,
      'discount_percentage'
    >;

    const useUpsert = Boolean(parsed.data.ingest_external_id?.trim());

    const query = useUpsert
      ? supabaseAdmin
          .from('deals')
          .upsert(rowForDb, { onConflict: 'ingest_external_id' })
          .select()
          .single()
      : supabaseAdmin.from('deals').insert(rowForDb).select().single();

    const { data, error } = await query;

    if (error) {
      log.error('insert failed', { code: error.code, message: error.message });
      const responseBody: Record<string, unknown> = { error: 'Database insert failed' };
      if (process.env.NODE_ENV === 'development') {
        responseBody.detail = error.message;
      }
      return NextResponse.json(responseBody, { status: 500 });
    }

    const deal = data as Deal | null;
    if (deal?.id) {
      captureServerEvent('ingest_deal_success', {
        distinctId: 'ingest',
        deal_id: deal.id,
        upsert: useUpsert,
      });
      try {
        revalidatePath('/');
        revalidatePath(`/deals/${deal.id}`);
      } catch (revalidateCause) {
        log.warn('revalidatePath failed', {
          message: revalidateCause instanceof Error ? revalidateCause.message : 'unknown',
        });
      }
    }

    try {
      const status = useUpsert ? 200 : 201;
      return NextResponse.json(data as Deal, {
        status,
        headers: {
          'X-RateLimit-Remaining': verdict.remaining.toString(),
          'X-RateLimit-Reset': Math.floor(verdict.resetAt / 1000).toString(),
        },
      });
    } catch (serializeCause) {
      log.error('response serialization failed', {
        message: serializeCause instanceof Error ? serializeCause.message : 'unknown',
      });
      const responseBody: Record<string, unknown> = { error: 'Internal Server Error' };
      if (process.env.NODE_ENV === 'development' && serializeCause instanceof Error) {
        responseBody.detail = serializeCause.message;
      }
      return NextResponse.json(responseBody, { status: 500 });
    }
  } catch (cause) {
    log.error('unhandled', {
      message: cause instanceof Error ? cause.message : 'unknown',
    });
    const responseBody: Record<string, unknown> = { error: 'Internal Server Error' };
    if (process.env.NODE_ENV === 'development' && cause instanceof Error) {
      responseBody.detail = cause.message;
    }
    return NextResponse.json(responseBody, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return measureSlo('ingest.deals', () =>
    withIngestRootSpan('ingest.deals.post', () => handleIngestPost(request))
  );
}
