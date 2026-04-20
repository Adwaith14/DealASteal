'use client';

import { useState, useCallback } from 'react';
import type { Deal } from '@/types/database.types';
import { DealCard } from './DealCard';

type SectionType = 'top' | 'hot';

const SECTION_CONFIG = {
  top: {
    icon: '🔥',
    title: 'Top Deals',
    subtitle: 'Curated picks',
    bannerBg: 'bg-gradient-to-r from-[#ef3d23] to-[#ff7f1f]',
    viewAllHref: '/deals?type=top',
  },
  hot: {
    icon: '🔥',
    title: 'Hot Deals',
    subtitle: 'Trending now',
    bannerBg: 'bg-gradient-to-r from-[#f59e0b] to-[#f4b000]',
    viewAllHref: '/deals?type=hot',
  },
} as const;

type Props = {
  type: SectionType;
  initialDeals: Deal[];
  total: number;
  origin: string;
};

export function ExpandableDealsSection({ type, initialDeals, total, origin }: Props) {
  const cfg = SECTION_CONFIG[type];
  const [expanded, setExpanded] = useState(false);
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const collapsedVisibleCount = Math.min(initialDeals.length, 6);
  const remaining = Math.max(total - collapsedVisibleCount, 0);

  const handleSeeAll = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (allDeals.length > 0) {
      setExpanded(true);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/deals/${type}?offset=0&limit=96`);
      if (!res.ok) throw new Error('Failed');
      const data = (await res.json()) as { deals: Deal[]; total: number };
      setAllDeals(data.deals);
      setExpanded(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [expanded, allDeals.length, type]);

  const displayDeals = expanded ? allDeals : initialDeals.slice(0, 6);

  return (
    <section className="py-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-gray-900">
          <span aria-hidden>{cfg.icon}</span>
          {cfg.title}
        </h2>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-gray-500 sm:block">{cfg.subtitle}</span>
          {total > 0 && (
            <a
              href={cfg.viewAllHref}
              className="inline-flex items-center gap-1 rounded-md border border-orange-300 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 transition hover:bg-orange-100"
            >
              View All ({total})
            </a>
          )}
        </div>
      </div>

      {/* Deals grid */}
      {displayDeals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
          No deals available in this section right now.
        </div>
      ) : (
        <div className={`grid gap-2.5 sm:gap-3 ${expanded ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
          {displayDeals.map((deal, i) => (
            <DealCard
              key={deal.id}
              deal={deal}
              priority={i < 6}
              dealPageUrl={`${origin}/deals/${deal.id}`}
            />
          ))}
        </div>
      )}

      {/* "X more waiting" banner */}
      {remaining > 0 && (
        <div
          className={`mt-3 flex items-center justify-between rounded-xl px-3 py-2.5 text-white shadow-sm ${cfg.bannerBg}`}
        >
          <span className="flex items-center gap-2 text-[12px] font-semibold sm:text-sm">
            <span aria-hidden>🔥</span>
            {expanded
              ? `Showing all ${total} ${cfg.title.toLowerCase()}`
              : `${remaining} more ${cfg.title.toLowerCase()} waiting`}
          </span>
          <button
            onClick={handleSeeAll}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md bg-white/25 px-3 py-1 text-[12px] font-bold text-white ring-1 ring-white/40 transition hover:bg-white/35 active:scale-95 disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Loading
              </span>
            ) : expanded ? (
              'Show less ▲'
            ) : (
              'See all ›'
            )}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-center text-sm text-red-600">
          Failed to load — please try again.
        </p>
      )}
    </section>
  );
}
