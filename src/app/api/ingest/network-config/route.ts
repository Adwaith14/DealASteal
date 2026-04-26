import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { isValidIngestionAuth } from '@/lib/ingest/verify-ingestion-auth';
import { cacheHeaders } from '@/lib/http/cache-headers';
import { logger } from '@/lib/observability/logger';
import { callerIdentity } from '@/lib/security/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const log = logger.child('api/ingest/network-config');

export async function GET(request: NextRequest) {
  const headers = cacheHeaders('noStore');
  if (!isValidIngestionAuth(request, process.env.INGESTION_API_KEY)) {
    log.warn('network-config denied', { caller: callerIdentity(request.headers) });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('ingest_network_settings')
    .select('network_slug, ingest_enabled, tos_url, disclosure_note, attribution_note, updated_at')
    .order('network_slug', { ascending: true });

  if (error) {
    log.error('network-config read failed', { message: error.message });
    return NextResponse.json({ error: 'Database read failed' }, { status: 500, headers });
  }

  const bySlug: Record<string, unknown> = {};
  for (const row of data ?? []) {
    const r = row as Record<string, unknown>;
    const slug = r.network_slug as string;
    bySlug[slug] = {
      ingestEnabled: r.ingest_enabled,
      tosUrl: r.tos_url,
      disclosureNote: r.disclosure_note,
      attributionNote: r.attribution_note,
      updatedAt: r.updated_at,
    };
  }

  return NextResponse.json({ networks: bySlug }, { headers });
}
