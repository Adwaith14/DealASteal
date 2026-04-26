import { NextResponse } from 'next/server';
import { cacheHeaders } from '@/lib/http/cache-headers';
import { logger } from '@/lib/observability/logger';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';

export const runtime = 'nodejs';

const log = logger.child('api/me/delete');

/**
 * Hard-delete the signed-in user via Supabase Auth Admin. Cascades: ``profiles``,
 * ``saved_deals`` (FK CASCADE). ``click_events.user_id`` is ``ON DELETE SET NULL``
 * (anonymised).
 */
export async function DELETE() {
  const headers = cacheHeaders('noStore');
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      log.error('admin deleteUser failed', { message: error.message });
      return NextResponse.json({ error: 'Account deletion failed' }, { status: 500, headers });
    }
    return new NextResponse(null, { status: 204, headers });
  } catch (cause) {
    log.error('delete account unhandled', {
      message: cause instanceof Error ? cause.message : 'unknown',
    });
    return NextResponse.json({ error: 'Account deletion failed' }, { status: 500, headers });
  }
}
