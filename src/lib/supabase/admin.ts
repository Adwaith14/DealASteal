import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function readRequiredEnv(name: string, value: string | undefined): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    throw new Error(
      `[DealASteal/Supabase] Missing required environment variable "${name}". The admin client cannot bypass RLS without it.`
    );
  }
  return trimmed;
}

export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ??
    process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = readRequiredEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!supabaseUrl) {
    throw new Error(
      '[DealASteal/Supabase] Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL). The admin client needs a project URL.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
