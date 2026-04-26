'use client';

import { DealCard } from '@/components/deals/DealCard';
import type { Deal } from '@/types/database.types';

export type BestDealHeroProps = {
  deal: Deal | null;
  origin: string;
};

/** Homepage hero for the top ``best_deals_today`` row (client-only presentation). */
export function BestDealHero({ deal, origin }: BestDealHeroProps) {
  if (!deal) return null;

  return (
    <section
      aria-labelledby="best-deal-hero-heading"
      className="mb-4 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50/40 p-3 shadow-sm sm:p-4"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2
          id="best-deal-hero-heading"
          className="text-lg font-extrabold tracking-tight text-gray-900 sm:text-xl"
        >
          <span aria-hidden className="mr-1.5">
            ⭐
          </span>
          Best deal right now
        </h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950">
          Score {(deal.score != null ? Math.round(deal.score) : '—')}/100
        </span>
      </div>
      <div className="mx-auto max-w-md">
        <DealCard deal={deal} priority dealPageUrl={`${origin}/deals/${deal.id}`} />
      </div>
    </section>
  );
}
