import 'server-only';

import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminSupabase } from '@/lib/admin/require-admin';
import { cacheHeaders } from '@/lib/http/cache-headers';
import { logger } from '@/lib/observability/logger';
import { AdminDealPatchSchema } from '@/types/schemas';

const log = logger.child('api/admin/deals');

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const headers = cacheHeaders('noStore');
  const gate = await requireAdminSupabase();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: gate.status, headers });
  }

  const { id: dealId } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(dealId)) {
    return NextResponse.json({ error: 'Invalid deal id' }, { status: 400, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers });
  }

  const parsed = AdminDealPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 400, headers });
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.category_slug !== undefined) {
    patch.category_slug = parsed.data.category_slug;
  }
  if (parsed.data.admin_hidden !== undefined) {
    patch.admin_hidden = parsed.data.admin_hidden;
  }
  if (parsed.data.pinned === true) {
    patch.admin_pinned_at = new Date().toISOString();
  } else if (parsed.data.pinned === false) {
    patch.admin_pinned_at = null;
  }

  const { data, error } = await gate.supabase.from('deals').update(patch).eq('id', dealId).select('id').maybeSingle();
  if (error) {
    log.error('admin deal update failed', { message: error.message, code: error.code });
    return NextResponse.json({ error: 'Update failed' }, { status: 500, headers });
  }
  if (!data) {
    return NextResponse.json({ error: 'Deal not found or not permitted' }, { status: 404, headers });
  }

  const { error: auditErr } = await gate.supabase.from('admin_actions').insert({
    actor_id: gate.userId,
    action: 'deal_patch',
    entity_type: 'deal',
    entity_id: dealId,
    details: patch,
  });
  if (auditErr) {
    log.error('admin_actions insert failed', { message: auditErr.message });
  }

  try {
    revalidatePath('/');
    revalidatePath(`/deals/${dealId}`);
  } catch {}

  return NextResponse.json({ ok: true }, { headers });
}
