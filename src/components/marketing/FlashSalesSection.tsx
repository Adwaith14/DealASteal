'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { DealWithMerchantName } from '@/types/database.types';
import { FlashSaleCard } from '@/components/marketing/FlashSaleCard';

type FlashSalesSectionProps = {
  deals: DealWithMerchantName[];
};

export function FlashSalesSection({ deals: initialDeals }: FlashSalesSectionProps) {
  const [deals, setDeals] = useState(initialDeals);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/expiring?limit=20`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.deals)) {
        setDeals(data.deals);
        setExpanded(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const showLess = useCallback(() => {
    setDeals(initialDeals);
    setExpanded(false);
  }, [initialDeals]);

  return (
    <section id="expiring-deals" className="scroll-mt-24 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#0B1340]">
            <span className="text-red-600" aria-hidden>
              ⚡
            </span>
            Expiring Deals
          </h2>
          <span className="rounded-md bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
            Ending Soon
          </span>
        </div>
        <Link href="/deals" className="text-sm font-semibold text-[#26BBA4] hover:underline">
          View all
        </Link>
      </div>

      {deals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-600">
          No deals expiring in the next week right now.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {deals.map((deal, i) => (
            <div key={deal.id}>
              <FlashSaleCard deal={deal} priority={i < 5} />
            </div>
          ))}
        </div>
      )}

      {initialDeals.length > 0 && (
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
      )}
    </section>
  );
}
