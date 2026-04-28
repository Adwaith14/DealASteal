'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import type { Deal } from '@/types/database.types';
import { DealsCatalogCard } from '@/components/deals/DealsCatalogCard';
import { DealCard } from '@/components/deals/DealCard';

type ApiSuccess = {
  ok: true;
  deals: Deal[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
};

type ApiFail = { ok: false; error?: string };

export type ActiveDealsFilterParams = {
  q?: string;
  category?: string;
  store?: string;
  max_price?: string;
  min_disc?: string;
  loot?: string;
  sort?: string;
};

type ActiveDealsInfiniteListProps = {
  variant: 'catalog' | 'home';
  /** PDP base — required when ``variant`` is ``home``. */
  siteOrigin?: string;
  initialDeals: Deal[];
  initialPage: number;
  totalPages: number;
  pageSize: number;
  filterParams: ActiveDealsFilterParams;
};

function buildActiveDealsApiUrl(page: number, filters: ActiveDealsFilterParams, pageSize: number): string {
  const sp = new URLSearchParams();
  sp.set('page', String(page));
  sp.set('pageSize', String(pageSize));
  if (filters.q) {
    sp.set('q', filters.q);
  }
  if (filters.category) {
    sp.set('category', filters.category);
  }
  if (filters.store) {
    sp.set('store', filters.store);
  }
  if (filters.max_price) {
    sp.set('max_price', filters.max_price);
  }
  if (filters.min_disc) {
    sp.set('min_disc', filters.min_disc);
  }
  if (filters.loot) {
    sp.set('loot', filters.loot);
  }
  if (filters.sort) {
    sp.set('sort', filters.sort);
  }
  return `/api/deals/active?${sp.toString()}`;
}

export function ActiveDealsInfiniteList({
  variant,
  siteOrigin,
  initialDeals,
  initialPage,
  totalPages,
  pageSize,
  filterParams,
}: ActiveDealsInfiniteListProps) {
  const [deals, setDeals] = useState(initialDeals);
  const [page, setPage] = useState(initialPage);
  const [remoteTotalPages, setRemoteTotalPages] = useState(totalPages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterKey = JSON.stringify(filterParams);

  /** URL / filter changes re-pass props; sync so ``totalPages`` and rows match the new browse. */
  useEffect(() => {
    setDeals(initialDeals);
    setPage(initialPage);
    setRemoteTotalPages(totalPages);
    setError(null);
    setLoading(false);
  }, [filterKey, initialPage, totalPages, pageSize]);

  const canLoadMore = page < remoteTotalPages;

  const loadMore = useCallback(async () => {
    if (loading || page >= remoteTotalPages) {
      return;
    }
    const nextPage = page + 1;
    setLoading(true);
    setError(null);

    try {
      const url = buildActiveDealsApiUrl(nextPage, filterParams, pageSize);
      const res = await fetch(url);
      const data = (await res.json()) as ApiSuccess | ApiFail;
      if (!res.ok || data.ok !== true || !Array.isArray(data.deals)) {
        setError(
          typeof (data as ApiFail).error === 'string'
            ? (data as ApiFail).error!
            : 'Could not load deals.'
        );
        return;
      }
      setDeals((prev) => {
        const seen = new Set(prev.map((d) => d.id));
        return [...prev, ...data.deals.filter((d) => !seen.has(d.id))];
      });
      setPage(data.page);
      setRemoteTotalPages(data.totalPages);
    } catch {
      setError('Could not load deals.');
    } finally {
      setLoading(false);
    }
  }, [filterParams, loading, page, pageSize, remoteTotalPages]);

  const gridClass =
    variant === 'home'
      ? 'grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5'
      : 'grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5';

  if (variant === 'home' && !siteOrigin) {
    return null;
  }

  return (
    <div>
      <div className={gridClass}>
        {deals.map((deal, i) =>
          variant === 'catalog' ? (
            <DealsCatalogCard key={deal.id} deal={deal} priority={i < 4} />
          ) : (
            <DealCard
              key={deal.id}
              deal={deal}
              priority={i < 8}
              dealPageUrl={`${siteOrigin}/deals/${deal.id}`}
            />
          )
        )}
      </div>
      {error ? (
        <p className="mt-4 text-center text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {canLoadMore ? (
        <div className={`mt-8 flex ${variant === 'catalog' ? 'justify-end' : 'justify-center'}`}>
          <button
            type="button"
            disabled={loading}
            onClick={loadMore}
            className="inline-flex min-h-11 items-center rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-[#0B1340] shadow-sm transition enabled:hover:border-gray-300 enabled:hover:bg-gray-50 disabled:cursor-wait disabled:opacity-70"
            aria-busy={loading}
          >
            {loading ? 'Loading…' : 'Show more'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
