'use client';

import { useCallback, useState } from 'react';
import type { CuratedSortMode } from '@/services/api/deals-sections';
import type { Deal } from '@/types/database.types';
import { CuratedDealCard } from '@/components/marketing/CuratedDealCard';

type CuratedExpandResponse = {
  ok?: boolean;
  deals?: Deal[];
  error?: string;
};

type CuratedDealGridSectionProps = {
  id: string;
  headingId: string;
  label: string;
  mode: CuratedSortMode;
  initialDeals: Deal[];
};

const DEFAULT_EXPAND_LIMIT = 20;

export function CuratedDealGridSection({
  id,
  headingId,
  label,
  mode,
  initialDeals,
}: CuratedDealGridSectionProps) {
  const [deals, setDeals] = useState(initialDeals);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ sort: mode, limit: String(DEFAULT_EXPAND_LIMIT) });
      const res = await fetch(`/api/deals/curated?${params.toString()}`);
      const data = (await res.json()) as CuratedExpandResponse;
      if (!res.ok || data.ok !== true || !Array.isArray(data.deals)) {
        setError(typeof data.error === 'string' ? data.error : 'Could not load more deals.');
        return;
      }
      setDeals(data.deals);
      setExpanded(true);
    } catch {
      setError('Could not load more deals.');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  const showLess = useCallback(() => {
    setDeals(initialDeals);
    setExpanded(false);
    setError(null);
  }, [initialDeals]);

  return (
    <section
      id={id}
      className="scroll-mt-24"
      aria-labelledby={headingId}
      role="region"
      aria-busy={loading}
    >
      <h2 id={headingId} className="mb-4 text-xl font-extrabold text-[#0B1340]">
        {label}
      </h2>
      {deals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-600">
          No deals in this view right now.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {deals.map((deal, i) => (
            <CuratedDealCard key={deal.id} deal={deal} priority={i < 5} />
          ))}
        </div>
      )}
      {error ? (
        <p className="mt-3 text-right text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {initialDeals.length > 0 ? (
        <div className="mt-4 flex justify-end">
          {!expanded ? (
            <button
              type="button"
              disabled={loading}
              onClick={loadMore}
              className="inline-flex min-h-10 items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#0B1340] shadow-sm transition enabled:hover:border-gray-300 enabled:hover:bg-gray-50 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? 'Loading…' : 'See more'}
            </button>
          ) : (
            <button
              type="button"
              onClick={showLess}
              className="inline-flex min-h-10 items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#0B1340] shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            >
              Show less
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
