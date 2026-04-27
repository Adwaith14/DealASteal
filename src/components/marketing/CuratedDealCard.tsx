import Image from 'next/image';
import Link from 'next/link';
import type { DealWithMerchantName } from '@/types/database.types';
import { DealImagePlaceholderIcon } from '@/components/deals/deal-image-placeholder';
import { formatDealListedAgo } from '@/utils/deal-time';

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

type CuratedDealCardProps = {
  deal: DealWithMerchantName;
  priority?: boolean;
};

export function CuratedDealCard({ deal, priority = false }: CuratedDealCardProps) {
  const discountPct = Math.round(deal.discount_percentage);
  const imageUrl = deal.image_url?.trim() ?? '';
  const hasImage = imageUrl.length > 0;
  const retailer = deal.merchant_name?.trim() || 'Store';
  const listed = formatDealListedAgo(deal.created_at);
  const trustWidth = Math.min(100, Math.max(8, discountPct));

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <Link
        href={`/deals/${deal.id}`}
        className="relative block min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-[#26BBA4] focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/3] w-full min-w-0 bg-[#f7f8fa]">
          <span className="absolute right-2 top-2 z-10 rounded-full bg-[#26BBA4] px-2.5 py-1 text-[10px] font-extrabold uppercase leading-none text-white">
            {discountPct}% OFF
          </span>
          <span className="absolute bottom-2 left-2 z-10 rounded-full bg-gray-800/80 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            Verified <span suppressHydrationWarning>{listed}</span>
          </span>
          {hasImage ? (
            <Image
              src={imageUrl}
              alt={deal.title}
              width={640}
              height={480}
              priority={priority}
              sizes="(max-width: 768px) 50vw, 33vw"
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center" aria-label="No product image">
              <DealImagePlaceholderIcon className="h-14 w-14 text-gray-300" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 border-t border-gray-100 px-3 pb-3 pt-2">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="truncate font-semibold text-gray-600">{retailer}</span>
          <div className="flex min-w-0 max-w-[55%] flex-1 items-center gap-1.5">
            <span className="shrink-0 text-[10px] font-semibold text-gray-500">Deal</span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200" title={`${discountPct}% off`}>
              <div
                className="h-full rounded-full bg-[#26BBA4]"
                style={{ width: `${trustWidth}%` }}
              />
            </div>
            <span className="shrink-0 tabular-nums text-[10px] font-bold text-[#0B1340]">{discountPct}%</span>
          </div>
        </div>

        <Link href={`/deals/${deal.id}`} className="min-w-0">
          <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-[#0B1340] hover:text-[#26BBA4]">
            {deal.title}
          </h3>
        </Link>
        {deal.description ? (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-gray-500">{deal.description}</p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-xs text-gray-400 line-through">{formatMoney(deal.original_price)}</span>
            <span className="text-base font-black tabular-nums text-[#0B1340]">{formatMoney(deal.discount_price)}</span>
          </div>
          <a
            href={deal.affiliate_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl bg-[#26BBA4] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[#1fa08d]"
          >
            Get Deal
          </a>
        </div>
      </div>
    </article>
  );
}
