import { FloatingContact } from '@/components/layout/FloatingContact';
import { HomeHeroSection } from '@/components/layout/HomeHeroSection';
import { PageWithAdRails } from '@/components/layout/PageWithAdRails';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { HomeFilterBar } from '@/components/deals/HomeFilterBar';
import { DealBrowseView } from '@/components/deals/DealBrowseView';
import { BestDealsMarquee } from '@/components/deals/BestDealsMarquee';
import { ActiveDealsInfiniteList } from '@/components/deals/ActiveDealsInfiniteList';
import { HomeMarketingHero } from '@/components/marketing/HomeMarketingHero';
import { FlashSalesSection } from '@/components/marketing/FlashSalesSection';
import { HomeCategoryTiles } from '@/components/marketing/HomeCategoryTiles';
import { CuratedForYouSection } from '@/components/marketing/CuratedForYouSection';
import { HomeFaqSection } from '@/components/marketing/HomeFaqSection';
import {
  getExpiringDeals,
  getCouponDeals,
  getTopDeals,
  getHotDeals,
  getLatestDeals,
  getBestDealOfDay,
  getCuratedDeals,
} from '@/services/api/deals-sections';
import { getActiveDeals } from '@/services/api/deals';
import { getSiteOrigin } from '@/utils/site-origin';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { getForUser } from '@/services/api/recommendations';
import {
  normalizeDealSortParam,
  normalizeLootDealsParam,
  normalizeMaxPriceParam,
  normalizeMinDiscountParam,
  normalizeStoreParam,
} from '@/constants/deal-browse-filters';
import { isDealCategorySlug } from '@/constants/deal-categories';
import { collectUniqueSectionFetchErrors } from '@/utils/collect-unique-section-fetch-errors';
import { parseActiveDealsBrowseFromSearchParams } from '@/lib/deals/parse-active-deals-browse-query';
import type { ActiveDealsFilterParams } from '@/components/deals/ActiveDealsInfiniteList';

const HOME_BROWSE_PAGE_SIZE = 10;

type HomePageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    store?: string;
    min_disc?: string;
    max_price?: string;
    loot?: string;
    sort?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const sp = await searchParams;

  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const categoryRaw = typeof sp.category === 'string' ? sp.category : '';
  const categoryNorm = categoryRaw.trim().toLowerCase();
  const categoryForFilter = isDealCategorySlug(categoryNorm) ? categoryNorm : null;
  const appliedStore = normalizeStoreParam(typeof sp.store === 'string' ? sp.store : '');
  const appliedMinDiscount = normalizeMinDiscountParam(
    typeof sp.min_disc === 'string' ? sp.min_disc : ''
  );
  const appliedMaxPrice = normalizeMaxPriceParam(
    typeof sp.max_price === 'string' ? sp.max_price : ''
  );
  const appliedLootOnly = normalizeLootDealsParam(typeof sp.loot === 'string' ? sp.loot : '');
  const sortFromUrl = typeof sp.sort === 'string' ? sp.sort : undefined;
  const appliedSort = normalizeDealSortParam(
    sortFromUrl ?? (q.length > 0 ? 'relevance' : undefined)
  );

  const isSearchMode =
    q.length > 0 ||
    Boolean(categoryForFilter) ||
    Boolean(appliedStore) ||
    Boolean(appliedMinDiscount) ||
    Boolean(appliedMaxPrice) ||
    appliedLootOnly ||
    appliedSort !== 'newest';

  const origin = await getSiteOrigin();

  /* ── Search / filter mode ── */
  if (isSearchMode) {
    const browse = parseActiveDealsBrowseFromSearchParams({
      page: '1',
      pageSize: String(HOME_BROWSE_PAGE_SIZE),
      q: q || undefined,
      category: categoryRaw || undefined,
      store: typeof sp.store === 'string' ? sp.store : undefined,
      min_disc: typeof sp.min_disc === 'string' ? sp.min_disc : undefined,
      max_price: typeof sp.max_price === 'string' ? sp.max_price : undefined,
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
    if (appliedStore) {
      filterParams.store = appliedStore;
    }
    if (appliedMinDiscount != null) {
      filterParams.min_disc = String(appliedMinDiscount);
    }
    if (appliedMaxPrice != null) {
      filterParams.max_price = String(appliedMaxPrice);
    }
    if (appliedLootOnly) {
      filterParams.loot = '1';
    }

    return (
      <div className="flex min-h-dvh min-w-0 max-w-full flex-col bg-white text-gray-900">
        <SiteHeader />
        <HomeHeroSection>
          <HomeFilterBar
            listBasePath="/"
            searchQuery={q}
            activeCategorySlug={categoryForFilter}
            activeStore={appliedStore}
            activeMinDiscount={appliedMinDiscount}
            activeMaxPrice={appliedMaxPrice}
            activeLootOnly={appliedLootOnly}
            activeSort={appliedSort}
            panel
            affiliateNote
          />
        </HomeHeroSection>

        <PageWithAdRails className="flex-1 pb-8 pt-4">
          <main id="main-content" className="w-full">
            <div className="mb-6">
              <h1 className="text-xl font-extrabold text-[#0B1340] sm:text-2xl">
                {q ? `Results for "${q}"` : 'Browse Deals'}
              </h1>
              {result.ok && (
                <p className="mt-1 text-sm text-gray-500">
                  {result.totalCount} deal{result.totalCount !== 1 ? 's' : ''} found
                </p>
              )}
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
              <ActiveDealsInfiniteList
                variant="home"
                siteOrigin={origin}
                initialDeals={result.deals}
                initialPage={result.page}
                totalPages={result.totalPages}
                pageSize={HOME_BROWSE_PAGE_SIZE}
                filterParams={filterParams}
              />
            )}
          </main>
        </PageWithAdRails>

        <SiteFooter />
        <FloatingContact />
      </div>
    );
  }

  /* ── Full homepage (no active search) ── */
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [expiringSection, couponSection, topResult, hotResult, latestResult, bestDealResult, forYouDeals, newestCurated, popularCurated, biggestCurated] =
    await Promise.all([
      getExpiringDeals(20),
      getCouponDeals(16),
      getTopDeals({ limit: 6 }),
      getHotDeals({ limit: 6 }),
      getLatestDeals({ page: 1, pageSize: 36 }),
      getBestDealOfDay(),
      user ? getForUser(user.id, 12) : Promise.resolve([]),
      getCuratedDeals('newest', 10),
      getCuratedDeals('popular', 10),
      getCuratedDeals('biggest_drop', 10),
    ]);

  const sectionFetchErrors = collectUniqueSectionFetchErrors(
    expiringSection.fetchError,
    couponSection.fetchError,
    topResult.fetchError,
    hotResult.fetchError,
    latestResult.fetchError,
    bestDealResult.fetchError,
    newestCurated.fetchError,
    popularCurated.fetchError,
    biggestCurated.fetchError
  );

  const curatedBuckets = {
    newest: newestCurated.deals,
    popular: popularCurated.deals,
    biggest_drop: biggestCurated.deals,
  };

  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col bg-[#f5f5f5] text-gray-900">
      <SiteHeader />
      <HomeMarketingHero />

      <PageWithAdRails className="flex-1 pb-8 pt-2">
        <main id="main-content" className="w-full">
          {sectionFetchErrors.length > 0 ? (
            <div
              role="alert"
              className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 sm:px-4"
            >
              <p className="font-semibold">Some deal sections could not load.</p>
              {sectionFetchErrors.length === 1 ? (
                <p className="mt-1 text-xs leading-relaxed sm:text-sm">{sectionFetchErrors[0]}</p>
              ) : (
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed sm:text-sm">
                  {sectionFetchErrors.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

        <BestDealsMarquee deals={topResult.deals} origin={origin} />

        <HomeCategoryTiles />
        
        <FlashSalesSection deals={expiringSection.deals} />

        <CuratedForYouSection buckets={curatedBuckets} />

        <HomeFaqSection />
        </main>
      </PageWithAdRails>

      <SiteFooter />
      <FloatingContact />
    </div>
  );
}
