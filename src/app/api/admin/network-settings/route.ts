import 'server-only';

import { NextResponse } from 'next/server';
import { requireAdminSupabase } from '@/lib/admin/require-admin';
import { cacheHeaders } from '@/lib/http/cache-headers';
import { AdminNetworkSettingsPatchSchema } from '@/types/schemas';

export async function GET() {
  const headers = cacheHeaders('noStore');
  const gate = await requireAdminSupabase();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: gate.status, headers });
  }

  const { data, error } = await gate.supabase
    .from('ingest_network_settings')
    .select('network_slug, ingest_enabled, tos_url, disclosure_note, attribution_note, updated_at')
    .order('network_slug', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }

  return NextResponse.json({ settings: data ?? [] }, { headers });
}

export async function PATCH(request: Request) {
  const headers = cacheHeaders('noStore');
  const gate = await requireAdminSupabase();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: gate.status, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers });
  }

  const parsed = AdminNetworkSettingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 400, headers });
  }

  const { network_slug, ...rest } = parsed.data;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (rest.ingest_enabled !== undefined) patch.ingest_enabled = rest.ingest_enabled;
  if (rest.tos_url !== undefined) patch.tos_url = rest.tos_url;
  if (rest.disclosure_note !== undefined) patch.disclosure_note = rest.disclosure_note;
  if (rest.attribution_note !== undefined) patch.attribution_note = rest.attribution_note;

  const { error } = await gate.supabase.from('ingest_network_settings').update(patch).eq('network_slug', network_slug);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }

  return NextResponse.json({ ok: true }, { headers });
}
