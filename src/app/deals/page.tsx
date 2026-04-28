import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { FloatingContact } from '@/components/layout/FloatingContact';
import { DealsCatalogSidebar } from '@/components/deals/DealsCatalogSidebar';
import { ActiveDealsInfiniteList } from '@/components/deals/ActiveDealsInfiniteList';
import { getActiveDeals } from '@/services/api/deals';
import { parseActiveDealsBrowseFromSearchParams } from '@/lib/deals/parse-active-deals-browse-query';
import {
  normalizeDealSortParam,
  normalizeLootDealsParam,
  normalizeMaxPriceParam,
} from '@/constants/deal-browse-filters';
import { isDealCategorySlug } from '@/constants/deal-categories';
import type { ActiveDealsFilterParams } from '@/components/deals/ActiveDealsInfiniteList';

type DealsCatalogPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    max_price?: string;
    loot?: string;
    sort?: string;
  }>;
};

const PAGE_SIZE = 12;

export default async function DealsCatalogPage({ searchParams }: DealsCatalogPageProps) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const categoryRaw = typeof sp.category === 'string' ? sp.category : '';
  const categoryNorm = categoryRaw.trim().toLowerCase();
  const categoryForFilter = isDealCategorySlug(categoryNorm) ? categoryNorm : null;
  const appliedMaxPrice = normalizeMaxPriceParam(typeof sp.max_price === 'string' ? sp.max_price : '');
  const appliedLootOnly = normalizeLootDealsParam(typeof sp.loot === 'string' ? sp.loot : '');
  const appliedSort = normalizeDealSortParam(typeof sp.sort === 'string' ? sp.sort : '');

  const browse = parseActiveDealsBrowseFromSearchParams({
    page: '1',
    pageSize: String(PAGE_SIZE),
    q: q || undefined,
    category: categoryRaw || undefined,
    max_price: typeof sp.max_price === 'string' ? sp.max_price : undefined,
    loot: typeof sp.loot === 'string' ? sp.loot : undefined,
    sort: typeof sp.sort === 'string' ? sp.sort : undefined,
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
  if (appliedLootOnly) {
    filterParams.loot = '1';
  }
  if (appliedSort) {
    filterParams.sort = appliedSort;
  }

  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col bg-[#f3f4f6] text-gray-900">
      <SiteHeader fullWidth />

      <main className="mx-auto w-full max-w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid items-start gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <DealsCatalogSidebar
            searchQuery={q}
            activeCategorySlug={categoryForFilter}
            activeMaxPrice={appliedMaxPrice}
            activeLootOnly={appliedLootOnly}
            activeSort={appliedSort}
          />

          <div className="min-w-0">
            <header className="mb-4">
              <p className="text-lg font-black text-[#0B1340]">Algorithmically Vetted Hot Deals</p>
              <p className="mt-1 max-w-2xl text-sm text-gray-600">
                Discover top-rated offers curated by our AI and verified by the community.
              </p>
            </header>

            {!result.ok ? (
              <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950">
                <p className="font-semibold">Could not load deals right now.</p>
                <p className="mt-1 text-sm">{result.error}</p>
              </div>
            ) : result.deals.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
                <p className="text-lg font-semibold text-gray-900">No deals match these filters.</p>
                <p className="mt-2 text-sm text-gray-500">Try clearing filters or broadening your category.</p>
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
