import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAnonSupabaseClient } from '@/lib/supabase/create-anon-client';

let _serverAnon: SupabaseClient | null | undefined;

/**
 * Server-only Supabase **anon** client (RLS applies). No cookie/session persistence.
 * Use from Server Components, Route Handlers, and server actions — not from client bundles.
 * Null when NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing or invalid.
 */
export function getSupabaseServerAnon(): SupabaseClient | null {
  if (_serverAnon !== undefined) {
    return _serverAnon;
  }

  _serverAnon = createAnonSupabaseClient({
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return _serverAnon;
}
