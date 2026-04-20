import { FloatingContact } from '@/components/layout/FloatingContact';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { HorizontalDealScroll } from '@/components/deals/HorizontalDealScroll';
import { ExpandableDealsSection } from '@/components/deals/ExpandableDealsSection';
import { LatestDealsSection } from '@/components/deals/LatestDealsSection';
import { DealCard } from '@/components/deals/DealCard';
import { DealsPagination } from '@/components/deals/DealsPagination';
import {
  getExpiringDeals,
  getCouponDeals,
  getTopDeals,
  getHotDeals,
  getLatestDeals,
} from '@/services/api/deals-sections';
import { getActiveDeals } from '@/services/api/deals';
import { getSiteOrigin } from '@/utils/site-origin';
import {
  normalizeMaxPriceParam,
  normalizeMinDiscountParam,
  normalizeStoreParam,
} from '@/constants/deal-browse-filters';
import { isDealCategorySlug } from '@/constants/deal-categories';

type HomePageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    category?: string;
    store?: string;
    min_disc?: string;
    max_price?: string;
  }>;
};

/** Thin affiliate disclosure bar shown at the very top of the page. */
function AnnouncementBar() {
  return (
    <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-center text-[11px] text-amber-800 sm:text-xs">
      As an Amazon Associate we earn from qualifying purchases. Prices subject to change.{' '}
      <a href="/#affiliate" className="font-semibold underline hover:text-amber-900">
        Learn more
      </a>
    </div>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
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

  const isSearchMode =
    q.length > 0 ||
    Boolean(categoryForFilter) ||
    Boolean(appliedStore) ||
    Boolean(appliedMinDiscount) ||
    Boolean(appliedMaxPrice);

  const origin = await getSiteOrigin();

  /* ── Search / filter mode ── */
  if (isSearchMode) {
    const result = await getActiveDeals({
      page,
      query: q,
      category: categoryRaw,
      store: appliedStore ?? undefined,
      minDiscount: appliedMinDiscount ?? undefined,
      maxPrice: appliedMaxPrice ?? undefined,
    });

    return (
      <div className="flex min-h-dvh flex-col bg-[#f5f5f5] text-gray-900">
        <SiteHeader initialSearchQuery={q} />
        <AnnouncementBar />

        <main className="mx-auto w-full max-w-[920px] flex-1 px-3 py-6 sm:px-4 lg:px-5">
          <div className="mb-6">
            <h1 className="text-xl font-extrabold text-gray-900 sm:text-2xl">
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
                page={result.page}
                totalPages={result.totalPages}
                query={q}
                categorySlug={result.appliedCategorySlug}
                store={result.appliedStore}
                minDiscount={result.appliedMinDiscount}
                maxPrice={result.appliedMaxPrice}
              />
            </>
          )}
        </main>

        <SiteFooter />
        <FloatingContact />
      </div>
    );
  }

  /* ── Full homepage (no active search) ── */
  const [expiringDeals, couponDeals, topResult, hotResult, latestResult] = await Promise.all([
    getExpiringDeals(20),
    getCouponDeals(16),
    getTopDeals({ limit: 6 }),
    getHotDeals({ limit: 6 }),
    getLatestDeals({ page: 1, pageSize: 36 }),
  ]);

  const couponCodeMap = new Map<string, string>(
    couponDeals.map((d) => [d.id, d.coupon_code])
  );

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f5] text-gray-900">
      <SiteHeader initialSearchQuery="" />
      <AnnouncementBar />

      <main className="mx-auto w-full max-w-[920px] flex-1 px-3 py-2 sm:px-4 lg:px-5">
        {/* ── Expiring Soon ── */}
        <HorizontalDealScroll
          icon="⏱"
          title="Expiring Soon"
          subtitle="Grab them before they're gone"
          deals={expiringDeals}
          origin={origin}
        />

        {/* ── Coupon Deals ── */}
        <HorizontalDealScroll
          icon="🏷"
          title="Coupon Deals"
          subtitle="Use code at checkout"
          deals={couponDeals}
          origin={origin}
          couponCodes={couponCodeMap}
        />

        {/* ── Top Deals ── */}
        <ExpandableDealsSection
          type="top"
          initialDeals={topResult.deals}
          total={topResult.total}
          origin={origin}
        />

        {/* ── Hot Deals ── */}
        <ExpandableDealsSection
          type="hot"
          initialDeals={hotResult.deals}
          total={hotResult.total}
          origin={origin}
        />

        {/* ── Latest Deals ── */}
        <LatestDealsSection
          initialDeals={latestResult.deals}
          total={latestResult.total}
          origin={origin}
        />
      </main>

      <SiteFooter />
      <FloatingContact />
    </div>
  );
}
