import Image from 'next/image';
import Link from 'next/link';
import type { DealWithMerchantName } from '@/types/database.types';
import { DealImagePlaceholderIcon } from '@/components/deals/deal-image-placeholder';
import { FlashSaleCountdown } from '@/components/marketing/FlashSaleCountdown';

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

type FlashSaleCardProps = {
  deal: DealWithMerchantName;
  priority?: boolean;
};

export function FlashSaleCard({ deal, priority = false }: FlashSaleCardProps) {
  const discountPct = Math.round(deal.discount_percentage);
  const imageUrl = deal.image_url?.trim() ?? '';
  const hasImage = imageUrl.length > 0;
  const retailer = deal.merchant_name?.trim() || 'Store';

  return (
    <article className="flex w-[min(100%,11.5rem)] min-w-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:w-[13.5rem]">
      <Link
        href={`/deals/${deal.id}`}
        className="flex min-w-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-[#26BBA4] focus-visible:ring-offset-2"
      >
        <div className="relative aspect-square w-full min-w-0 bg-[#f7f8fa]">
          <span className="absolute left-2 top-2 z-10 rounded-md bg-red-600 px-2 py-1 text-[10px] font-extrabold uppercase leading-none text-white">
            {discountPct}% OFF
          </span>
          {hasImage ? (
            <Image
              src={imageUrl}
              alt={deal.title}
              width={400}
              height={400}
              priority={priority}
              sizes="(max-width: 640px) 42vw, 180px"
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center" aria-label="No product image">
              <DealImagePlaceholderIcon className="h-10 w-10 text-gray-300" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1 px-2.5 py-2">
          <p className="flex items-center gap-1 text-[11px] text-gray-600">
            <svg className="size-3.5 shrink-0 text-gray-500" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            <FlashSaleCountdown expiresAt={deal.expires_at} />
          </p>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-[12px] font-bold leading-snug text-[#0B1340]">
            {deal.title}
          </h3>
          <div className="mt-0.5 flex items-end justify-between gap-1">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 line-through">{formatMoney(deal.original_price)}</span>
              <span className="text-sm font-black tabular-nums text-[#0B1340]">{formatMoney(deal.discount_price)}</span>
            </div>
            <span className="max-w-[4.5rem] shrink-0 truncate text-right text-[10px] font-semibold text-gray-500">
              {retailer}
            </span>
          </div>
        </div>
      </Link>
      <div className="px-2.5 pb-2.5">
        <a
          href={deal.affiliate_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-8 w-full items-center justify-center rounded-xl bg-[#26BBA4] px-2 py-1.5 text-center text-[11px] font-bold text-white transition hover:bg-[#1fa08d]"
        >
          Get deal
        </a>
      </div>
    </article>
  );
}
