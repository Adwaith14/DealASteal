import type { Metadata } from 'next';
import { FloatingContact } from '@/components/layout/FloatingContact';
import { HomeHeroSection } from '@/components/layout/HomeHeroSection';
import { PageWithAdRails } from '@/components/layout/PageWithAdRails';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { HomeFilterBar } from '@/components/deals/HomeFilterBar';
import { DealBrowseView } from '@/components/deals/DealBrowseView';
import { getActiveDeals } from '@/services/api/deals';
import { getSiteOrigin } from '@/utils/site-origin';
import {
  normalizeDealSortParam,
  normalizeLootDealsParam,
  normalizeMaxPriceParam,
  normalizeMinDiscountParam,
  normalizeStoreParam,
} from '@/constants/deal-browse-filters';
import { isDealCategorySlug } from '@/constants/deal-categories';

export const metadata: Metadata = {
  title: 'Search deals',
  description: 'Search hand-picked coupons and discounts from top stores.',
};

type SearchPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    category?: string;
    store?: string;
    min_disc?: string;
    max_price?: string;
    loot?: string;
    sort?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;

  const rawPage = Number.parseInt(sp.page ?? '1', 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
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

  const result = await getActiveDeals({
    page,
    query: q,
    category: categoryRaw,
    store: appliedStore ?? undefined,
    minDiscount: appliedMinDiscount ?? undefined,
    maxPrice: appliedMaxPrice ?? undefined,
    lootOnly: appliedLootOnly || undefined,
    sort: appliedSort,
  });

  const origin = await getSiteOrigin();

  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col bg-[#f5f5f5] text-gray-900">
      <SiteHeader initialSearchQuery={q} />
      <HomeHeroSection>
        <HomeFilterBar
          listBasePath="/search"
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

      <PageWithAdRails className="flex-1 px-3 pb-8 pt-4 sm:px-4 lg:px-6">
        <main id="main-content" className="w-full">
          <DealBrowseView result={result} origin={origin} q={q} listBasePath="/search" />
        </main>
      </PageWithAdRails>

      <SiteFooter />
      <FloatingContact />
    </div>
  );
}
