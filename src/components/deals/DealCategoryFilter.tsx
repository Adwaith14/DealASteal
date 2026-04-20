import Link from 'next/link';
import {
  DEAL_CATEGORY_LABELS,
  DEAL_CATEGORY_NAV,
  isDealCategorySlug,
} from '@/constants/deal-categories';
import { buildHomeDealListHref } from '@/utils/deal-feed-query';

type DealCategoryFilterProps = {
  activeCategorySlug: string | null;
  searchQuery: string;
};

/**
 * Server-rendered facet pills for the home feed (SEO-friendly links).
 */
export function DealCategoryFilter({
  activeCategorySlug,
  searchQuery,
}: DealCategoryFilterProps) {
  const pillActive =
    'border-red-600 bg-red-600 text-white shadow-sm hover:bg-red-700 hover:border-red-700';
  const pillIdle =
    'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50';

  return (
    <div
      className="mt-6 flex flex-wrap items-center gap-2"
      aria-label="Filter deals by category"
    >
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Category
      </span>
      <Link
        href={buildHomeDealListHref({ q: searchQuery })}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          activeCategorySlug == null ? pillActive : pillIdle
        }`}
      >
        All
      </Link>
      {DEAL_CATEGORY_NAV.map(({ slug, label }) => {
        const active = activeCategorySlug === slug;
        return (
          <Link
            key={slug}
            href={buildHomeDealListHref({ category: slug, q: searchQuery })}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              active ? pillActive : pillIdle
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export function formatCategoryLabel(slug: string | null): string | null {
  if (slug == null) {
    return null;
  }
  return isDealCategorySlug(slug) ? DEAL_CATEGORY_LABELS[slug] : slug;
}
