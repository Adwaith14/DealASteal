import Image from 'next/image';
import Link from 'next/link';
import { DealShareRow } from '@/components/deals/DealShareRow';
import { SaveDealButton } from '@/components/deals/SaveDealButton';
import { DealImagePlaceholderIcon } from '@/components/deals/deal-image-placeholder';
import { formatDealEndsIn, formatDealListedAgo } from '@/utils/deal-time';
import { trustAffiliateSourceLabel } from '@/utils/deal-trust';
import type { Deal } from '@/types/database.types';

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type DealCardProps = {
  deal: Deal;
  /** Use sparingly for above-the-fold cards (LCP). */
  priority?: boolean;
  /** Absolute URL to this deal's detail page (for share row). */
  dealPageUrl: string;
  /** Coupon code to display on the card (for Coupon Deals section). */
  couponCode?: string;
};

export function DealCard({ deal, priority = false, dealPageUrl, couponCode }: DealCardProps) {
  const discountPct = Math.round(deal.discount_percentage);
  const discountLabel = `${discountPct}% OFF`;
  const imageUrl = deal.image_url?.trim() ?? '';
  const hasImage = imageUrl.length > 0;
  const listed = formatDealListedAgo(deal.created_at);
  const endsIn = formatDealEndsIn(deal.expires_at);
  const trustSource = trustAffiliateSourceLabel(deal);

  return (
    <article className="group flex h-full min-w-0 w-full flex-col overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:shadow-md">
      {/*
        The Link wraps the image + content area so the whole card body is clickable
        and navigates to the deal detail page. The affiliate button sits outside this
        link so it opens the retailer without conflicting with the card navigation.
      */}
      <Link
        href={`/deals/${deal.id}`}
        className="flex min-w-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
        tabIndex={0}
      >
        {/* Image */}
        <div className="relative flex aspect-square w-full min-w-0 shrink-0 items-center justify-center bg-[#fcfcfc]">
          <span className="absolute left-2 top-2 z-20 inline-flex max-w-[calc(100%-1rem)] items-center rounded-full bg-orange-500 px-2 py-1 text-[10px] font-extrabold uppercase leading-none tracking-wide text-white shadow-sm sm:left-2.5 sm:top-2.5">
            {deal.is_loot_deal ? <span aria-hidden>🔥&nbsp;</span> : null}
            {discountLabel}
          </span>
          {hasImage ? (
            <Image
              src={imageUrl}
              alt={deal.title}
              width={800}
              height={800}
              priority={priority}
              sizes="(max-width: 480px) 48vw, (max-width: 1024px) 220px, 190px"
              className="max-h-full max-w-full object-contain p-2.5 transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div
              className="flex h-full min-h-[8rem] w-full items-center justify-center bg-gray-50"
              aria-label="No product image"
            >
              <DealImagePlaceholderIcon className="h-12 w-12 text-gray-300" />
            </div>
          )}
        </div>

        {/* Text content */}
        <div className="flex flex-1 flex-col gap-1.5 px-2.5 pt-2.5">
          <h2 className="line-clamp-2 text-pretty text-[12px] font-semibold leading-snug text-gray-900 transition group-hover:text-orange-700 sm:text-[13px]">
            {deal.title}
          </h2>

          {trustSource ? (
            <p className="text-[9px] font-medium uppercase tracking-wide text-gray-500">
              Source: <span className="normal-case text-gray-700">{trustSource}</span>
            </p>
          ) : null}

          <p className="flex items-center gap-1 text-[10px] text-gray-500">
            <ClockIcon className="size-3 shrink-0 text-gray-400" />
            <span suppressHydrationWarning>{listed}</span>
          </p>

          {endsIn ? (
            <p className="flex items-center gap-1 text-[10px] font-semibold text-red-600">
              <ClockIcon className="size-3 shrink-0" />
              <span suppressHydrationWarning>{endsIn}</span>
            </p>
          ) : null}

          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 pt-0.5">
            <span className="text-base font-black tabular-nums text-red-600 sm:text-lg">
              <span className="sr-only">Discounted price </span>
              {formatMoney(deal.discount_price)}
            </span>
            <span className="text-[11px] text-gray-400 line-through">
              <span className="sr-only">Original price </span>
              {formatMoney(deal.original_price)}
            </span>
          </div>
          <p className="text-[9px] text-gray-400">Prices may vary</p>
        </div>
      </Link>

      {/* Action footer — outside the card Link so button/share remain independently clickable */}
      <div className="mt-1.5 flex flex-col gap-2 px-2.5 pb-2.5">
        <div className="flex items-center justify-end">
          <SaveDealButton dealId={deal.id} />
        </div>
        {couponCode ? (
          <div className="flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1.5">
            <TagIcon className="size-3.5 shrink-0 text-green-600" />
            <span className="text-[11px] font-bold text-green-700">
              Use code: <span className="font-extrabold tracking-wide">{couponCode}</span>
            </span>
          </div>
        ) : null}
        <a
          href={deal.affiliate_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 w-full items-center justify-center rounded-md bg-orange-500 px-3 py-1.5 text-center text-[12px] font-bold text-white shadow-sm outline-none transition hover:bg-orange-600 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 active:bg-orange-700"
        >
          Grab the Deal
        </a>
        <DealShareRow dealPageUrl={dealPageUrl} title={deal.title} />
      </div>
    </article>
  );
}
