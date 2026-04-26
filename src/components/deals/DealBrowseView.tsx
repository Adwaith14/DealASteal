import { DealCard } from '@/components/deals/DealCard';
import { DealsPagination } from '@/components/deals/DealsPagination';
import { SearchCategoryHints } from '@/components/deals/SearchCategoryHints';
import type { ActiveDealsFetchResult } from '@/services/api/deals';
import type { DealListBasePath } from '@/utils/deal-feed-query';

type DealBrowseViewProps = {
  result: ActiveDealsFetchResult;
  origin: string;
  q: string;
  listBasePath: DealListBasePath;
};

export function DealBrowseView({ result, origin, q, listBasePath }: DealBrowseViewProps) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-gray-900 sm:text-2xl">
          {q ? `Results for "${q}"` : 'Browse Deals'}
        </h1>
        {result.ok && (
          <p className="mt-1 text-sm text-gray-500">
            {result.totalCount} deal{result.totalCount !== 1 ? 's' : ''} found
          </p>
        )}
        {q ? <SearchCategoryHints q={q} listBasePath={listBasePath} /> : null}
      </div>

      {!result.ok ? (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950">
          <p className="font-semibold">Could not load deals right now.</p>
          <p className="mt-1 text-sm">{result.error}</p>
        </div>
      ) : result.deals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <p className="text-lg font-semibold text-gray-900">No deals match your search.</p>
          <p className="mt-2 text-sm text-gray-500">Try different keywords or clear the search.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
            {result.deals.map((deal, i) => (
              <DealCard
                key={deal.id}
                deal={deal}
                priority={i < 8}
                dealPageUrl={`${origin}/deals/${deal.id}`}
              />
            ))}
          </div>
          <DealsPagination
            listBasePath={listBasePath}
            page={result.page}
            totalPages={result.totalPages}
            query={q}
            categorySlug={result.appliedCategorySlug}
            store={result.appliedStore}
            minDiscount={result.appliedMinDiscount}
            maxPrice={result.appliedMaxPrice}
            lootDeals={result.appliedLootOnly}
            sort={result.appliedSort}
          />
        </>
      )}
    </>
  );
}
