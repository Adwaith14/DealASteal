import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import { tryGetNextPublicSupabaseConfig } from '@/lib/supabase/next-public-env';

/**
 * Creates a Supabase client with the **anon** key (RLS applies).
 * Pass server-friendly auth options when instantiating on the server.
 * Returns null when public Supabase env is unset or invalid.
 */
export function createAnonSupabaseClient(
  options?: SupabaseClientOptions<'public'>
): SupabaseClient | null {
  const cfg = tryGetNextPublicSupabaseConfig();
  if (!cfg) {
    return null;
  }

  return createClient(cfg.url, cfg.anonKey, {
    ...options,
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      ...options?.auth,
    },
  });
}
