import { FloatingContact } from '@/components/layout/FloatingContact';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { ActiveDealsInfiniteList } from '@/components/deals/ActiveDealsInfiniteList';
import { SearchResultsSidebar } from '@/components/deals/SearchResultsSidebar';
import { DealSearchBarForm } from '@/components/marketing/DealSearchBarForm';
import { getActiveDeals } from '@/services/api/deals';
import { parseActiveDealsBrowseFromSearchParams } from '@/lib/deals/parse-active-deals-browse-query';
import {
  normalizeLootDealsParam,
  normalizeMaxPriceParam,
  normalizeMinDiscountParam,
} from '@/constants/deal-browse-filters';
import { isDealCategorySlug } from '@/constants/deal-categories';
import type { ActiveDealsFilterParams } from '@/components/deals/ActiveDealsInfiniteList';

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    max_price?: string;
    min_disc?: string;
    loot?: string;
  }>;
};

const PAGE_SIZE = 12;

export default async function SearchResultsPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const categoryRaw = typeof sp.category === 'string' ? sp.category : '';
  const categoryNorm = categoryRaw.trim().toLowerCase();
  const categoryForFilter = isDealCategorySlug(categoryNorm) ? categoryNorm : null;
  const appliedMaxPrice = normalizeMaxPriceParam(typeof sp.max_price === 'string' ? sp.max_price : '');
  const appliedMinDiscount = normalizeMinDiscountParam(typeof sp.min_disc === 'string' ? sp.min_disc : '');
  const appliedLootOnly = normalizeLootDealsParam(typeof sp.loot === 'string' ? sp.loot : '');

  const browse = parseActiveDealsBrowseFromSearchParams({
    page: '1',
    pageSize: String(PAGE_SIZE),
    q: q || undefined,
    category: categoryRaw || undefined,
    max_price: typeof sp.max_price === 'string' ? sp.max_price : undefined,
    min_disc: typeof sp.min_disc === 'string' ? sp.min_disc : undefined,
    loot: typeof sp.loot === 'string' ? sp.loot : undefined,
  });

  const result = await getActiveDeals(browse);

  const filterParams: ActiveDealsFilterParams = {};
  if (q) {
    filterParams.q = q;
  }
  if (categoryForFilter) {
    filterParams.category = categoryForFilter;
  }
  if (appliedMaxPrice != null) {
    filterParams.max_price = String(appliedMaxPrice);
  }
  if (appliedMinDiscount != null) {
    filterParams.min_disc = String(appliedMinDiscount);
  }
  if (appliedLootOnly) {
    filterParams.loot = '1';
  }

  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col bg-[#f3f4f6] text-gray-900">
      <SiteHeader fullWidth />

      <main className="mx-auto w-full max-w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
          <SearchResultsSidebar
            searchQuery={q}
            activeCategorySlug={categoryForFilter}
            activeMaxPrice={appliedMaxPrice}
            activeMinDiscount={appliedMinDiscount}
            activeLootOnly={appliedLootOnly}
          />

          <div className="min-w-0">
            <div className="mb-6 flex justify-center">
              <DealSearchBarForm
                inputId="search-page-q"
                defaultQuery={q}
                className="w-full max-w-xl"
                preserve={{
                  category: categoryRaw || null,
                  maxPrice: appliedMaxPrice,
                  minDiscount: appliedMinDiscount,
                  lootDeals: appliedLootOnly,
                }}
              />
            </div>

            <header className="mb-4">
              <div>
                <p className="text-lg font-black text-[#0B1340]">
                  {q ? `Search results for “${q}”` : 'Search deals'}
                </p>
                <p className="mt-1 max-w-2xl text-sm text-gray-600">
                  Refine with filters on the left; use Show more to load additional matching products here.
                </p>
              </div>
            </header>

            {!result.ok ? (
              <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950">
                <p className="font-semibold">Could not load deals right now.</p>
                <p className="mt-1 text-sm">{result.error}</p>
              </div>
            ) : result.deals.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
                <p className="text-lg font-semibold text-gray-900">No deals match these filters.</p>
                <p className="mt-2 text-sm text-gray-500">Try a different keyword or clear some filters.</p>
              </div>
            ) : (
              <ActiveDealsInfiniteList
                variant="catalog"
                initialDeals={result.deals}
                initialPage={result.page}
                totalPages={result.totalPages}
                pageSize={PAGE_SIZE}
                filterParams={filterParams}
              />
            )}
          </div>
        </section>
      </main>

      <SiteFooter fullWidth />
      <FloatingContact />
    </div>
  );
}
