import Link from 'next/link';
import { DEAL_CATEGORY_LABELS } from '@/constants/deal-categories';
import { suggestDealCategoriesFromQuery } from '@/lib/deals/search-category-suggestions';
import { buildDealListHref, type DealListBasePath } from '@/utils/deal-feed-query';

type SearchCategoryHintsProps = {
  q: string;
  listBasePath: DealListBasePath;
};

/**
 * Lightweight category chips when the query text overlaps known facet labels (Phase 17).
 */
export function SearchCategoryHints({ q, listBasePath }: SearchCategoryHintsProps) {
  const hints = suggestDealCategoriesFromQuery(q);
  if (hints.length === 0) {
    return null;
  }
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Suggested categories">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Try category
      </span>
      {hints.map((slug) => (
        <Link
          key={slug}
          href={buildDealListHref(listBasePath, {
            q,
            category: slug,
            sort: 'relevance',
          })}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm transition hover:border-red-300 hover:bg-red-50"
        >
          {DEAL_CATEGORY_LABELS[slug]}
        </Link>
      ))}
    </div>
  );
}
