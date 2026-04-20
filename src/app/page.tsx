import { DealCard } from '@/components/deals/DealCard';
import { HomeFilterBar } from '@/components/deals/HomeFilterBar';
import { DealsPagination } from '@/components/deals/DealsPagination';
import { FloatingContact } from '@/components/layout/FloatingContact';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import {
  normalizeMaxPriceParam,
  normalizeMinDiscountParam,
  normalizeStoreParam,
} from '@/constants/deal-browse-filters';
import { isDealCategorySlug } from '@/constants/deal-categories';
import { getActiveDeals } from '@/services/api/deals';
import { getSiteOrigin } from '@/utils/site-origin';

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

export default async function HomePage({ searchParams }: HomePageProps) {
  const sp = await searchParams;
  const rawPage = Number.parseInt(sp.page ?? '1', 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const categoryRaw = typeof sp.category === 'string' ? sp.category : '';
  const categoryNorm = categoryRaw.trim().toLowerCase();
  const categoryForFilter = isDealCategorySlug(categoryNorm) ? categoryNorm : null;

  const appliedStore = normalizeStoreParam(typeof sp.store === 'string' ? sp.store : '');
  const appliedMinDiscount = normalizeMinDiscountParam(
    typeof sp.min_disc === 'string' ? sp.min_disc : ''
  );
  const appliedMaxPrice = normalizeMaxPriceParam(typeof sp.max_price === 'string' ? sp.max_price : '');

  const [result, origin] = await Promise.all([
    getActiveDeals({
      page,
      query: q,
      category: categoryRaw,
      store: appliedStore ?? undefined,
      minDiscount: appliedMinDiscount ?? undefined,
      maxPrice: appliedMaxPrice ?? undefined,
    }),
    getSiteOrigin(),
  ]);

  const now = Date.now();
  const expiringDeals =
    result.ok
      ? result.deals.filter((d) => {
          if (d.expires_at == null || d.expires_at.trim() === '') {
            return false;
          }
          const end = new Date(d.expires_at).getTime();
          return !Number.isNaN(end) && end > now && end < now + 7 * 86400000;
        })
      : [];

  const showExpiringSection = result.ok && expiringDeals.length > 0;

  const filtersActive =
    Boolean(q.trim()) ||
    Boolean(categoryForFilter) ||
    Boolean(appliedStore) ||
    Boolean(appliedMinDiscount) ||
    Boolean(appliedMaxPrice);

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f5] text-gray-900">
      <SiteHeader initialSearchQuery={q} />

      {/* Hero — full-width red band */}
      <section className="bg-[#d32f2f] px-4 py-12 text-center sm:py-14 lg:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.5rem]">
            DealASteal — Today&apos;s Best Coupons &amp; Discounts
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/95 sm:text-base lg:text-lg">
            Hand-picked deals from top stores, updated daily. Save more on every purchase.
          </p>
        </div>
      </section>

      {/* Overlapping filter card */}
      <div className="relative z-10 mx-auto -mt-10 w-full max-w-5xl px-4 sm:px-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-lg sm:p-6">
          <HomeFilterBar
            searchQuery={q}
            activeCategorySlug={categoryForFilter}
            activeStore={appliedStore}
            activeMinDiscount={appliedMinDiscount}
            activeMaxPrice={appliedMaxPrice}
          />
          <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
            As an Amazon Associate, we earn from qualifying purchases. Prices and availability are
            subject to change.{' '}
            <a href="/#affiliate" className="text-orange-600 underline hover:text-orange-700">
              Learn more
            </a>
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {!result.ok ? (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950 shadow-sm"
          >
            <p className="font-semibold">We couldn&apos;t load deals right now.</p>
            <p className="mt-1 text-sm">{result.error}</p>
            {result.code ? (
              <p className="mt-2 font-mono text-xs text-amber-900/80">Code: {result.code}</p>
            ) : null}
            {result.hint ? (
              <p className="mt-1 font-mono text-xs text-amber-900/80">{result.hint}</p>
            ) : null}
          </div>
        ) : null}

        {showExpiringSection ? (
          <section className="mb-12" aria-label="Expiring soon">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-gray-900 sm:text-2xl">
                <span className="text-red-600" aria-hidden>
                  ⏱
                </span>
                Expiring Soon
              </h2>
              <p className="text-sm text-gray-500">Grab them before they&apos;re gone</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {expiringDeals.map((deal, index) => (
                <DealCard
                  key={`exp-${deal.id}`}
                  deal={deal}
                  priority={index < 4}
                  dealPageUrl={`${origin}/deals/${deal.id}`}
                />
              ))}
            </div>
          </section>
        ) : null}

        {result.ok ? (
          <section id="latest-deals" className="scroll-mt-24" aria-label="Latest deals">
            <div className="mb-4 flex flex-col gap-3 rounded-lg bg-orange-500 px-4 py-3 text-white shadow sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                <span aria-hidden>🔥</span>
                More top deals added around the clock
              </p>
              <a
                href="#latest-deals"
                className="inline-flex w-fit items-center rounded-md bg-white/20 px-3 py-1.5 text-sm font-bold text-white ring-1 ring-white/40 transition hover:bg-white/30"
              >
                See all
              </a>
            </div>

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <h2 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
                  <span className="text-blue-600" aria-hidden>
                    🕐
                  </span>
                  Latest Deals
                </h2>
                <span className="text-sm text-gray-500">
                  Showing {(result.page - 1) * result.pageSize + 1}–
                  {(result.page - 1) * result.pageSize + result.deals.length} of {result.totalCount}{' '}
                  deals
                </span>
              </div>
              <div
                className="inline-flex w-fit cursor-default items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm"
                title="Sorting options coming soon"
              >
                Newest First
                <span className="text-gray-400" aria-hidden>
                  ▾
                </span>
              </div>
            </div>

            {result.deals.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-14 text-center shadow-sm">
                <p className="text-lg font-semibold text-gray-900">
                  {filtersActive
                    ? 'No deals match these filters.'
                    : 'No active deals right now, check back soon!'}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  {filtersActive
                    ? 'Try widening store, discount, or price, or clear filters above.'
                    : 'We&apos;re lining up the next wave of steals.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {result.deals.map((deal, index) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      priority={index < 8}
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
          </section>
        ) : null}
      </div>

      <SiteFooter />
      <FloatingContact />
    </div>
  );
}
