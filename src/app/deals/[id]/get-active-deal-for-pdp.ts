import { cache } from 'react';
import { getActiveDealById } from '@/services/api/deals';

/** One Supabase round-trip per PDP request (shared by ``generateMetadata`` + page). */
export const getActiveDealForPdp = cache((id: string) => getActiveDealById(id));
