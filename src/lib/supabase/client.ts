import type { SupabaseClient } from '@supabase/supabase-js';
import { createAnonSupabaseClient } from '@/lib/supabase/create-anon-client';

/** Browser-oriented anon client (sessions may persist in local storage). */
export const supabase: SupabaseClient = createAnonSupabaseClient();
