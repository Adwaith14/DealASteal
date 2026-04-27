import type { SupabaseClient } from '@supabase/supabase-js';
import { createAnonSupabaseClient } from '@/lib/supabase/create-anon-client';

let _serverAnon: SupabaseClient | null = null;

/**
 * Server-only Supabase **anon** client (RLS applies). No cookie/session persistence.
 * Use from Server Components, Route Handlers, and server actions — not from client bundles.
 */
export function getSupabaseServerAnon(): SupabaseClient {
  if (_serverAnon) {
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
