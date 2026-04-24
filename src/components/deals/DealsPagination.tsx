import Link from 'next/link';
import type { DealStoreFilterKey } from '@/constants/deal-browse-filters';
import { buildHomeDealListHref } from '@/utils/deal-feed-query';

type DealsPaginationProps = {
  page: number;
  totalPages: number;
  query: string;
  categorySlug: string | null;
  store: DealStoreFilterKey | null;
  minDiscount: number | null;
  maxPrice: number | null;
  lootDeals?: boolean;
};

/**
 * Server-rendered page controls (SEO-friendly links, no client JS required).
 */
export function DealsPagination({
  page,
  totalPages,
  query,
  categorySlug,
  store,
  minDiscount,
  maxPrice,
  lootDeals = false,
}: DealsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  const linkClass =
    'rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600';
  const disabledClass =
    'rounded-md border border-transparent px-4 py-2 text-sm font-semibold text-gray-400';

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-gray-200 pt-8"
      aria-label="Deal list pagination"
    >
      {prev != null ? (
        <Link
          href={buildHomeDealListHref({
            page: prev,
            q: query,
            category: categorySlug ?? undefined,
            store: store ?? undefined,
            minDiscount: minDiscount ?? undefined,
            maxPrice: maxPrice ?? undefined,
            lootDeals: lootDeals || undefined,
          })}
          className={linkClass}
        >
          Previous
        </Link>
      ) : (
        <span className={disabledClass}>Previous</span>
      )}
      <span className="px-3 text-sm text-gray-600">
        Page <span className="font-mono font-bold text-gray-900">{page}</span> of{' '}
        <span className="font-mono font-bold text-gray-900">{totalPages}</span>
      </span>
      {next != null ? (
        <Link
          href={buildHomeDealListHref({
            page: next,
            q: query,
            category: categorySlug ?? undefined,
            store: store ?? undefined,
            minDiscount: minDiscount ?? undefined,
            maxPrice: maxPrice ?? undefined,
            lootDeals: lootDeals || undefined,
          })}
          className={linkClass}
        >
          Next
        </Link>
      ) : (
        <span className={disabledClass}>Next</span>
      )}
    </nav>
  );
}
