import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { isValidIngestionAuth } from '@/lib/ingest/verify-ingestion-auth';
import { logger } from '@/lib/observability/logger';
import { callerIdentity } from '@/lib/security/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { IngestNetworkStatusSchema } from '@/types/schemas';

const log = logger.child('api/ingest/network-status');

export async function POST(request: NextRequest) {
  if (!isValidIngestionAuth(request, process.env.INGESTION_API_KEY)) {
    log.warn('ingest network-status denied', { caller: callerIdentity(request.headers) });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = IngestNetworkStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date().toISOString();
  const row = {
    network: parsed.data.network,
    last_started_at: parsed.data.started_at ?? null,
    last_finished_at: parsed.data.finished_at ?? now,
    last_ok: parsed.data.ok,
    last_error: parsed.data.error ?? null,
    last_rows: parsed.data.rows ?? null,
    updated_at: now,
  };

  const { error } = await getSupabaseAdmin().from('ingest_network_status').upsert(row, { onConflict: 'network' });
  if (error) {
    log.error('ingest_network_status upsert failed', { message: error.message });
    return NextResponse.json({ error: 'Database write failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
