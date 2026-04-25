import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

/** Browser-oriented anon client (cookie session; see ``middleware``). Null if env not configured. */
export const supabase: SupabaseClient | null = getSupabaseBrowserClient();
