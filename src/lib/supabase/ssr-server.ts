import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import {
  getNextPublicSupabaseAnonKey,
  getNextPublicSupabaseUrl,
} from '@/lib/supabase/next-public-env';

/**
 * Per-request Supabase client with cookie session (Server Components, Route Handlers, Server Actions).
 * Do not cache the return value across requests.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(getNextPublicSupabaseUrl(), getNextPublicSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* Server Components cannot set cookies; middleware refreshes the session. */
        }
      },
    },
  });
}
