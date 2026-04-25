import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { tryGetNextPublicSupabaseConfig } from '@/lib/supabase/next-public-env';

let _browser: SupabaseClient | null | undefined;

/**
 * Browser singleton with cookie-backed auth (pairs with ``middleware`` session refresh).
 * Returns null when public Supabase env is unset or invalid (app stays usable without Supabase).
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (_browser !== undefined) {
    return _browser;
  }
  const cfg = tryGetNextPublicSupabaseConfig();
  if (!cfg) {
    _browser = null;
    return null;
  }
  _browser = createBrowserClient(cfg.url, cfg.anonKey);
  return _browser;
}
