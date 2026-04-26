import 'server-only';

import { NextResponse } from 'next/server';
import { requireAdminSupabase } from '@/lib/admin/require-admin';
import { dealSelectColumnsForPostgrest, dealsDbHasAdminSchema } from '@/lib/catalog/deals-db-schema';
import { cacheHeaders } from '@/lib/http/cache-headers';

const MAX_LIMIT = 80;

export async function GET(request: Request) {
  const headers = cacheHeaders('noStore');
  const gate = await requireAdminSupabase();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: gate.status, headers });
  }

  const url = new URL(request.url);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(url.searchParams.get('limit') ?? '40', 10) || 40));
  const offset = Math.max(0, Number.parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);

  let q = gate.supabase.from('deals').select(dealSelectColumnsForPostgrest());
  if (dealsDbHasAdminSchema()) {
    q = q.order('admin_pinned_at', { ascending: false, nullsFirst: false });
  }
  const { data, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }

  return NextResponse.json({ deals: data ?? [] }, { headers });
}
