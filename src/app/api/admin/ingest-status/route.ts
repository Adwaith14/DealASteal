import 'server-only';

import { NextResponse } from 'next/server';
import { requireAdminSupabase } from '@/lib/admin/require-admin';
import { cacheHeaders } from '@/lib/http/cache-headers';

export async function GET() {
  const headers = cacheHeaders('noStore');
  const gate = await requireAdminSupabase();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: gate.status, headers });
  }

  const { data, error } = await gate.supabase
    .from('ingest_network_status')
    .select('network, last_started_at, last_finished_at, last_ok, last_error, last_rows, updated_at')
    .order('network', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }

  return NextResponse.json({ networks: data ?? [] }, { headers });
}
