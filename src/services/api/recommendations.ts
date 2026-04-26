import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { Deal } from '@/types/database.types';

export async function getForUser(userId: string, limit = 8): Promise<Deal[]> {
  const supabase = getSupabaseAdmin();

  const { data: clicks, error: clicksError } = await supabase
    .from('click_events')
    .select('deal_id')
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })
    .limit(150);

  if (clicksError || !clicks || clicks.length === 0) {
    return [];
  }

  const clickedDealIds = Array.from(
    new Set(
      clicks
        .map((r) => (r as { deal_id?: string | null }).deal_id)
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
    )
  );
  if (clickedDealIds.length === 0) {
    return [];
  }

  const { data: clickedDeals, error: clickedDealsError } = await supabase
    .from('deals')
    .select('id,category_slug')
    .in('id', clickedDealIds);
  if (clickedDealsError || !clickedDeals) {
    return [];
  }

  const categoryAffinity = new Map<string, number>();
  for (const row of clickedDeals as Array<{ category_slug?: string | null }>) {
    const slug = row.category_slug?.trim().toLowerCase();
    if (!slug) continue;
    categoryAffinity.set(slug, (categoryAffinity.get(slug) ?? 0) + 1);
  }
  const categories = Array.from(categoryAffinity.keys());
  if (categories.length === 0) {
    return [];
  }

  const candidateLimit = Math.max(24, limit * 6);
  const { data: candidates, error: candidatesError } = await supabase
    .from('deals')
    .select(
      'id, merchant_id, title, description, original_price, discount_price, discount_percentage, affiliate_url, image_url, is_loot_deal, is_active, expires_at, created_at, category_slug, ingest_external_id, trust_bundle, currency, merchant_sku, asin, gtin, brand, rating, rating_count, availability, last_seen_at, score'
    )
    .eq('is_active', true)
    .in('category_slug', categories)
    .order('score', { ascending: false, nullsFirst: false })
    .order('discount_percentage', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(candidateLimit);
  if (candidatesError || !candidates) {
    return [];
  }

  const clickedSet = new Set(clickedDealIds);
  const ranked = (candidates as unknown as Deal[])
    .filter((d) => !clickedSet.has(d.id))
    .map((d) => {
      const affinity = d.category_slug ? categoryAffinity.get(d.category_slug) ?? 0 : 0;
      const base = typeof d.score === 'number' ? d.score : 0;
      return {
        deal: d,
        rank: base + affinity * 12 + (d.is_loot_deal ? 2 : 0),
      };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)
    .map((x) => x.deal);

  return ranked;
}
