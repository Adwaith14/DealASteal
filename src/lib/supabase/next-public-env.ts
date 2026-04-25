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

export function getNextPublicSupabaseUrl(): string {
  const url = readRequiredNextPublicEnv('NEXT_PUBLIC_SUPABASE_URL');
  assertValidHttpUrlForSupabase(url);
  return url;
}

export function getNextPublicSupabaseAnonKey(): string {
  return readRequiredNextPublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/** For middleware when env may be unset (e.g. CI without Supabase). */
export function tryGetNextPublicSupabaseConfig(): {
  url: string;
  anonKey: string;
} | null {
  const url = typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string'
    ? process.env.NEXT_PUBLIC_SUPABASE_URL.trim()
    : '';
  const anonKey =
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'string'
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()
      : '';
  if (!url || !anonKey) {
    return null;
  }
  try {
    assertValidHttpUrlForSupabase(url);
  } catch {
    return null;
  }
  return { url, anonKey };
}
