import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';

type NextPublicSupabaseEnvName =
  | 'NEXT_PUBLIC_SUPABASE_URL'
  | 'NEXT_PUBLIC_SUPABASE_ANON_KEY';

function readRequiredNextPublicEnv(name: NextPublicSupabaseEnvName): string {
  const raw = process.env[name];
  const value = typeof raw === 'string' ? raw.trim() : '';

  if (!value) {
    throw new Error(
      [
        `[DealASteal/Supabase] Missing required environment variable "${name}".`,
        'Define it in .env.local (local) or in your hosting provider’s environment (production).',
        'The Supabase anon client cannot be initialized without both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      ].join(' ')
    );
  }

  return value;
}

function assertValidHttpUrlForSupabase(url: string): void {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('unsupported protocol');
    }
  } catch {
    throw new Error(
      [
        '[DealASteal/Supabase] NEXT_PUBLIC_SUPABASE_URL is not a valid http(s) URL.',
        'Expected a value like https://<project-ref>.supabase.co (or http://127.0.0.1 for local Supabase).',
      ].join(' ')
    );
  }
}

/**
 * Creates a Supabase client with the **anon** key (RLS applies).
 * Pass server-friendly auth options when instantiating on the server.
 */
export function createAnonSupabaseClient(
  options?: SupabaseClientOptions<'public'>
): SupabaseClient {
  const supabaseUrl = readRequiredNextPublicEnv('NEXT_PUBLIC_SUPABASE_URL');
  assertValidHttpUrlForSupabase(supabaseUrl);
  const supabaseAnonKey = readRequiredNextPublicEnv(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );

  return createClient(supabaseUrl, supabaseAnonKey, {
    ...options,
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      ...options?.auth,
    },
  });
}
