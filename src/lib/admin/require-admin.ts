import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';

export type AdminGateResult =
  | { ok: true; userId: string; supabase: SupabaseClient }
  | { ok: false; status: 401 | 403 };

/**
 * Cookie session + ``profiles.role = 'admin'`` (RLS-backed read on ``profiles``).
 */
export async function requireAdminSupabase(): Promise<AdminGateResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, status: 401 };
  }
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (error || !profile || (profile as { role?: string }).role !== 'admin') {
    return { ok: false, status: 403 };
  }
  return { ok: true, userId: user.id, supabase };
}
