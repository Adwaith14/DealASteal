import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { isValidIngestionAuth } from '@/lib/ingest/verify-ingestion-auth';
import { logger } from '@/lib/observability/logger';
import { callerIdentity, createRateLimiterFromEnv } from '@/lib/security/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { CouponIngestDeleteSchema, CouponIngestSchema, CouponIngestUpdateSchema } from '@/types/schemas';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 32 * 1024;
const ingestLimiter = createRateLimiterFromEnv({ id: 'ingest-coupons', capacity: 120, windowMs: 60_000 });
const log = logger.child('api/ingest/coupons');

/** Returns a ``NextResponse`` when the request must stop; otherwise ``undefined``. */
async function authGate(request: NextRequest): Promise<NextResponse | undefined> {
  if (!isValidIngestionAuth(request, process.env.INGESTION_API_KEY)) {
    log.warn('ingest auth denied', { caller: callerIdentity(request.headers) });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const verdict = await ingestLimiter.consume(callerIdentity(request.headers));
  if (!verdict.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  return undefined;
}

async function readJsonWithCap(request: NextRequest): Promise<unknown | NextResponse> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }
  try {
    return JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await authGate(request);
  if (denied) return denied;
  const body = await readJsonWithCap(request);
  if (body instanceof NextResponse) return body;
  const parsed = CouponIngestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 400 });
  }

  const payload = {
    ...parsed.data,
    deal_id: parsed.data.deal_id ?? null,
    description: parsed.data.description ?? null,
    expires_at: parsed.data.expires_at ?? null,
    is_active: parsed.data.is_active ?? true,
  };
  const supabase = getSupabaseAdmin();
  const query = parsed.data.id
    ? supabase.from('coupons').upsert(payload, { onConflict: 'id' }).select().single()
    : supabase.from('coupons').insert(payload).select().single();
  const { data, error } = await query;
  if (error) {
    log.error('coupon write failed', { message: error.message, code: error.code });
    return NextResponse.json({ error: 'Database write failed' }, { status: 500 });
  }
  try {
    revalidatePath('/');
    if (payload.deal_id) revalidatePath(`/deals/${payload.deal_id}`);
  } catch {}
  return NextResponse.json(data, { status: parsed.data.id ? 200 : 201 });
}

export async function PATCH(request: NextRequest) {
  const denied = await authGate(request);
  if (denied) return denied;
  const body = await readJsonWithCap(request);
  if (body instanceof NextResponse) return body;
  const parsed = CouponIngestUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 400 });
  }
  const { id, ...patch } = parsed.data;
  const payload = {
    ...patch,
    description: patch.description === undefined ? undefined : patch.description,
    expires_at: patch.expires_at === undefined ? undefined : patch.expires_at,
    deal_id: patch.deal_id === undefined ? undefined : patch.deal_id,
  };
  const { data, error } = await getSupabaseAdmin()
    .from('coupons')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
  }
  try {
    revalidatePath('/');
    if ((data as { deal_id?: string | null })?.deal_id) revalidatePath(`/deals/${(data as { deal_id: string }).deal_id}`);
  } catch {}
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  const denied = await authGate(request);
  if (denied) return denied;
  const body = await readJsonWithCap(request);
  if (body instanceof NextResponse) return body;
  const parsed = CouponIngestDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 400 });
  }
  const { data, error } = await getSupabaseAdmin()
    .from('coupons')
    .update({ is_active: false })
    .eq('id', parsed.data.id)
    .select('id,deal_id')
    .single();
  if (error) {
    return NextResponse.json({ error: 'Database delete failed' }, { status: 500 });
  }
  try {
    revalidatePath('/');
    if ((data as { deal_id?: string | null })?.deal_id) revalidatePath(`/deals/${(data as { deal_id: string }).deal_id}`);
  } catch {}
  return NextResponse.json({ ok: true }, { status: 200 });
}
