import type { Deal } from '@/types/database.types';

/** Human label for ``trust_bundle.affiliate_network`` when present. */
export function trustAffiliateSourceLabel(deal: Deal): string | null {
  const raw = deal.trust_bundle?.affiliate_network?.trim();
  if (!raw) return null;
  return raw;
}
