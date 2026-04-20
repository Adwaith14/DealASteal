'use client';

import { useState, useCallback } from 'react';
import type { Deal } from '@/types/database.types';
import { DealCard } from './DealCard';

type Props = {
  initialDeals: Deal[];
  total: number;
  origin: string;
};

export function LatestDealsSection({ initialDeals, total, origin }: Props) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);

  const hasMore = deals.length < total;

  const loadMore = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/deals/latest?page=${nextPage}&pageSize=36`);
      if (!res.ok) throw new Error('Failed');
      const data = (await res.json()) as { deals: Deal[]; total: number };
      setDeals((prev) => [...prev, ...data.deals]);
      setPage(nextPage);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  return (
    <section id="latest-deals" className="scroll-mt-20 py-4">
      {/* Header */}
      <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-gray-900">
            <span aria-hidden>🕐</span>
            Latest Deals
          </h2>
          <span className="text-xs text-gray-500">
            Showing {deals.length} of {total} deals
          </span>
        </div>
        <div className="inline-flex w-fit cursor-default items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
          Newest First
          <span className="text-gray-400" aria-hidden>
            ▾
          </span>
        </div>
      </div>

      {/* Grid */}
      {deals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-900">No active deals right now — check back soon!</p>
          <p className="mt-2 text-sm text-gray-500">We&apos;re lining up the next wave of steals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
          {deals.map((deal, i) => (
            <DealCard
              key={deal.id}
              deal={deal}
              priority={i < 8}
              dealPageUrl={`${origin}/deals/${deal.id}`}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 flex flex-col items-center gap-2">
          {error && (
            <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
          )}
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-lg border border-orange-300 bg-white px-8 py-2.5 text-sm font-bold text-orange-700 shadow-sm transition hover:bg-orange-50 active:scale-95 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
                Loading…
              </>
            ) : (
              'Load More'
            )}
          </button>
          <p className="text-[11px] text-gray-400">
            {deals.length} of {total} deals loaded
          </p>
        </div>
      )}

      {!hasMore && deals.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-400">
          You&apos;ve seen all {total} deals — check back for fresh steals!
        </div>
      )}
    </section>
  );
}
