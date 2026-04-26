import {
  DEAL_CATEGORY_LABELS,
  DEAL_CATEGORY_SLUGS,
  type DealCategorySlug,
} from '@/constants/deal-categories';

/**
 * Suggest known category slugs when the user query overlaps slug or label text
 * (Phase 17 — lightweight hints; not semantic classification).
 */
export function suggestDealCategoriesFromQuery(raw: string): DealCategorySlug[] {
  const q = raw.trim().toLowerCase();
  if (!q) {
    return [];
  }
  const out: DealCategorySlug[] = [];
  for (const slug of DEAL_CATEGORY_SLUGS) {
    const label = DEAL_CATEGORY_LABELS[slug].toLowerCase();
    if (
      q.includes(slug) ||
      q.includes(label) ||
      label.includes(q) ||
      slug.includes(q)
    ) {
      out.push(slug);
    }
  }
  return out;
}
