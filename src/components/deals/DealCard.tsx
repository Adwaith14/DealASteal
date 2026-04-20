import Image from 'next/image';
import Link from 'next/link';
import { DealShareRow } from '@/components/deals/DealShareRow';
import { DealImagePlaceholderIcon } from '@/components/deals/deal-image-placeholder';
import { formatDealEndsIn, formatDealListedAgo } from '@/utils/deal-time';
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

export type DealCardProps = {
  deal: Deal;
  /** Use sparingly for above-the-fold cards (LCP). */
  priority?: boolean;
  /** Absolute URL to this deal’s detail page (for share row). */
  dealPageUrl: string;
};

export function DealCard({ deal, priority = false, dealPageUrl }: DealCardProps) {
  const discountPct = Math.round(deal.discount_percentage);
  const discountLabel = `${discountPct}% OFF`;
  const imageUrl = deal.image_url?.trim() ?? '';
  const hasImage = imageUrl.length > 0;
  const listed = formatDealListedAgo(deal.created_at);
  const endsIn = formatDealEndsIn(deal.expires_at);

  return (
    <article className="group flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square w-full shrink-0 bg-white sm:aspect-[4/3]">
        <span className="absolute left-2 top-2 z-20 inline-flex max-w-[calc(100%-1rem)] items-center rounded-md bg-orange-500 px-2 py-1 text-[11px] font-extrabold uppercase leading-none tracking-wide text-white shadow sm:left-3 sm:top-3">
          {deal.is_loot_deal ? <span aria-hidden>🔥 </span> : null}
          {discountLabel}
        </span>
        {hasImage ? (
          <Image
            src={imageUrl}
            alt={deal.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 320px"
            className="object-contain p-3 transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            className="flex h-full min-h-[10rem] w-full items-center justify-center bg-gray-50"
            aria-label="No product image"
          >
            <DealImagePlaceholderIcon className="h-14 w-14 text-gray-300" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="line-clamp-2 text-pretty text-sm font-bold leading-snug text-gray-900 sm:text-base">
          <Link
            href={`/deals/${deal.id}`}
            className="hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            {deal.title}
          </Link>
        </h2>

        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <ClockIcon className="size-3.5 shrink-0 text-gray-400" />
          <span>{listed}</span>
        </p>
        {endsIn ? (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <ClockIcon className="size-3.5 shrink-0" />
            <span>{endsIn}</span>
          </p>
        ) : null}

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1">
          <span className="text-xl font-black tabular-nums text-red-600 sm:text-2xl">
            <span className="sr-only">Discounted price </span>
            {formatMoney(deal.discount_price)}
          </span>
          <span className="text-sm text-gray-400 line-through">
            <span className="sr-only">Original price </span>
            {formatMoney(deal.original_price)}
          </span>
        </div>
        <p className="text-[10px] text-gray-400">Prices may vary</p>

        <div className="mt-auto flex flex-col gap-3 pt-1">
          <a
            href={deal.affiliate_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full min-h-10 items-center justify-center rounded-md bg-orange-500 px-4 py-2.5 text-center text-sm font-bold text-white shadow-sm outline-none transition hover:bg-orange-600 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 active:bg-orange-700"
          >
            Grab the Deal
          </a>
          <DealShareRow dealPageUrl={dealPageUrl} title={deal.title} />
        </div>
      </div>
    </article>
  );
}
