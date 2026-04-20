/**
 * Canonical deal category slugs for URL ``?category=`` and ingest validation.
 * Keep in sync with Zod ``DealIngestSchema`` and SQL comment on ``deals.category_slug``.
 */
export const DEAL_CATEGORY_SLUGS = [
  'tech',
  'laptops',
  'fashion',
  'home',
] as const;

export type DealCategorySlug = (typeof DEAL_CATEGORY_SLUGS)[number];

export const DEAL_CATEGORY_LABELS: Record<DealCategorySlug, string> = {
  tech: 'Tech',
  laptops: 'Laptops',
  fashion: 'Fashion',
  home: 'Home',
};

export const DEAL_CATEGORY_NAV: { slug: DealCategorySlug; label: string }[] =
  DEAL_CATEGORY_SLUGS.map((slug) => ({
    slug,
    label: DEAL_CATEGORY_LABELS[slug],
  }));

export function isDealCategorySlug(value: string): value is DealCategorySlug {
  return (DEAL_CATEGORY_SLUGS as readonly string[]).includes(value);
}
