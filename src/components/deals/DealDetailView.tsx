'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatCategoryLabel } from '@/components/deals/DealCategoryFilter';
import { DealImagePlaceholderIcon } from '@/components/deals/deal-image-placeholder';
import { CouponCopyGoButton } from '@/components/deals/CouponCopyGoButton';
import { PriceDropAlertForm } from '@/components/deals/PriceDropAlertForm';
import { DealShareRow } from '@/components/deals/DealShareRow';
import { SaveDealButton } from '@/components/deals/SaveDealButton';
import { isDealCategorySlug } from '@/constants/deal-categories';
import type { Coupon, Deal } from '@/types/database.types';
import { storeLabelFromAffiliateUrl } from '@/utils/affiliate-display';
import { getDealUrgencyForDisplay } from '@/utils/deal-pdp-urgency';
import { buildDealListHref } from '@/utils/deal-feed-query';
import { formatDealCountdownColons, formatDealEndsIn, formatDealListedAgo } from '@/utils/deal-time';
import { trustAffiliateSourceLabel } from '@/utils/deal-trust';

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type DealDetailViewProps = {
  deal: Deal;
  coupons: Coupon[];
  dealPageUrl: string;
  /** Whether the signed-in user has saved this deal (SSR when session exists). */
  initialSaved?: boolean;
  /** Price-drop email alert (Phase 20). */
  priceDropAlert?: {
    signedIn: boolean;
    initial: { id: string; thresholdPrice: number } | null;
  };
  relatedDeals: Deal[];
};

export function DealDetailView({ deal, coupons, dealPageUrl, initialSaved, priceDropAlert, relatedDeals }: DealDetailViewProps) {
  const discountPct = Math.round(deal.discount_percentage);
  const imageUrl = deal.image_url?.trim() ?? '';
  const hasImage = imageUrl.length > 0;
  const listed = formatDealListedAgo(deal.created_at);
  const endsIn = formatDealEndsIn(deal.expires_at);
  const trustSource = trustAffiliateSourceLabel(deal);
  const countdown = formatDealCountdownColons(deal.expires_at);
  const storeLabel = storeLabelFromAffiliateUrl(deal.affiliate_url);
  const categoryLabel = formatCategoryLabel(deal.category_slug);
  const savings = Math.max(0, deal.original_price - deal.discount_price);
  const categoryHref =
    deal.category_slug && isDealCategorySlug(deal.category_slug)
      ? buildDealListHref('/', { category: deal.category_slug })
      : null;

  return (
    <div className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-[#26BBA4]">Home</Link>
        <span>/</span>
        <Link href="/deals" className="hover:text-[#26BBA4]">Deals</Link>
        {categoryLabel && categoryHref && (
          <>
            <span>/</span>
            <Link href={categoryHref} className="hover:text-[#26BBA4]">{categoryLabel}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column: Image Product Area */}
        <div className="space-y-6">
          <div className="relative aspect-auto min-h-[400px] overflow-hidden rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center p-8">
            {hasImage ? (
              <Image
                src={imageUrl}
                alt={deal.title}
                width={800}
                height={600}
                className="max-h-[440px] w-auto object-contain drop-shadow-xl"
                priority
              />
            ) : (
              <DealImagePlaceholderIcon className="h-24 w-24 text-slate-200" />
            )}
            {discountPct > 0 && (
              <div className="absolute left-6 top-6 rounded-full bg-[#26BBA4] px-4 py-2 text-sm font-bold text-white shadow-lg">
                {discountPct}% OFF
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#0B1340]">Description</h2>
            <div className="mt-4 text-slate-600 leading-relaxed">
              {deal.description || "No detailed description provided for this deal. Please visit the merchant store for more information."}
            </div>
          </div>
        </div>

        {/* Right Column: Key info and Buy */}
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {storeLabel}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 uppercase tracking-wider">
                Vetted Deal
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-[#0B1340] leading-tight sm:text-3xl">
              {deal.title}
            </h1>

            {trustSource ? (
              <p className="text-xs text-gray-500 mb-2">
                Listing data source:{' '}
                <span className="font-semibold text-gray-700">{trustSource}</span>
              </p>
            ) : null}

            <div className="mt-6 flex items-baseline gap-4">
              <span className="text-4xl font-black text-[#0B1340]">
                {moneyFormatter.format(deal.discount_price)}
              </span>
              <span className="text-lg font-medium text-slate-400 line-through">
                {moneyFormatter.format(deal.original_price)}
              </span>
            </div>

            <p className="mt-2 text-sm font-medium text-[#26BBA4]">
              You save {moneyFormatter.format(savings)} today!
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <SaveDealButton dealId={deal.id} initialSaved={initialSaved} variant="wide" />
              <a
                href={`/api/click/${deal.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 flex-1 items-center justify-center gap-3 rounded-2xl bg-[#0B1340] text-lg font-bold text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98]"
              >
                Get This Deal Now <ExternalIcon className="size-5" />
              </a>
            </div>

            {priceDropAlert ? (
              <div className="mt-4">
                <PriceDropAlertForm
                  dealId={deal.id}
                  currentPrice={deal.discount_price}
                  signedIn={priceDropAlert.signedIn}
                  initialAlert={priceDropAlert.initial}
                />
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-50 pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-green-600 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                  Active & Verified
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Listed</span>
                <span className="font-semibold text-slate-700" suppressHydrationWarning>{listed}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Availability</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <ClockIcon className="size-4" />
                  {countdown ? `Ends in ${countdown}` : endsIn || "Limited Time"}
                </span>
              </div>
            </div>
          </div>

      {coupons && coupons.length > 0 ? (
        <section className="mt-8 rounded-3xl border border-slate-100 bg-white px-8 py-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#0B1340]">Applicable coupons</h2>
          <div className="mt-4 space-y-3">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-[#0B1340]">{c.title}</p>
                  <p className="text-xs text-gray-600">
                    Code: <span className="font-black tracking-wide text-gray-900">{c.code}</span>
                  </p>
                </div>
                <CouponCopyGoButton couponId={c.id} dealId={deal.id} code={c.code} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-100 bg-white px-8 py-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#0B1340]">Share this deal</h2>
          <div className="mt-5">
            <DealShareRow
              dealPageUrl={dealPageUrl}
              title={deal.title}
              includePinterest
              variant="panel"
            />
          </div>
        </section>
        
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-8">
           <h3 className="text-sm font-bold text-[#0B1340] uppercase tracking-wider mb-2">Editor&apos;s Review</h3>
           <p className="text-sm text-slate-600 leading-relaxed">
             This deal has been algorithmically vetted. We compare prices across multiple merchants to ensure this is among the best prices currently available.
           </p>
           <p className="mt-4 text-xs text-slate-500">
             As an Amazon Associate, we earn from qualifying purchases. Prices and availability are subject to change.{' '}
             <Link href="/affiliate-disclosure" className="text-red-600 underline hover:text-red-700">
               Affiliate disclosure
             </Link>
           </p>
        </div>
      </div>
          <Link
            href={dealPageUrl}
            className="text-center text-sm font-semibold text-slate-500 hover:text-slate-700"
          >
            Copy static link to this deal
          </Link>
        </div>
      </div>

      {/* Related Section */}
      <section className="mt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[#0B1340]">More deals you might like</h2>
          <Link href="/deals" className="text-sm font-bold text-[#26BBA4] hover:underline">View All Deals</Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {relatedDeals.map((item) => (
            <Link
              key={item.id}
              href={`/deals/${item.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-slate-50 p-4">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <DealImagePlaceholderIcon className="h-10 w-10 text-slate-200" />
                  </div>
                )}
                {item.discount_percentage > 0 && (
                   <span className="absolute left-2 top-2 rounded-full bg-[#26BBA4] px-2 py-0.5 text-[10px] font-bold text-white">
                     -{Math.round(item.discount_percentage)}%
                   </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="line-clamp-2 text-sm font-bold text-[#0B1340] group-hover:text-[#26BBA4] transition-colors">{item.title}</p>
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <span className="text-lg font-black text-[#0B1340]">
                    {moneyFormatter.format(item.discount_price)}
                  </span>
                  <span className="text-xs font-bold text-[#26BBA4]">View Deal</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
