import Image from 'next/image';
import Link from 'next/link';
import type { Deal } from '@/types/database.types';
import { DealImagePlaceholderIcon } from '@/components/deals/deal-image-placeholder';
import { DEAL_CATEGORY_LABELS } from '@/constants/deal-categories';

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

function toStoreLabel(affiliateUrl: string): string {
  try {
    const host = new URL(affiliateUrl).hostname.replace(/^www\./, '');
    const name = host.split('.')[0] ?? 'Store';
    return name.length > 0 ? name.charAt(0).toUpperCase() + name.slice(1) : 'Store';
  } catch {
    return 'Store';
  }
}

type DealsCatalogCardProps = {
  deal: Deal;
  priority?: boolean;
};

export function DealsCatalogCard({ deal, priority = false }: DealsCatalogCardProps) {
  const discountPct = Math.round(deal.discount_percentage);
  const imageUrl = deal.image_url?.trim() ?? '';
  const hasImage = imageUrl.length > 0;
  const categoryLabel =
    deal.category_slug && deal.category_slug in DEAL_CATEGORY_LABELS
      ? DEAL_CATEGORY_LABELS[deal.category_slug as keyof typeof DEAL_CATEGORY_LABELS]
      : 'Category';
  const storeLabel = toStoreLabel(deal.affiliate_url);

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <Link
        href={`/deals/${deal.id}`}
        className="group relative block min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-[#26BBA4] focus-visible:ring-offset-2"
      >
        <div className="relative aspect-4/3 w-full bg-[#f6f7f9]">
          <span className="absolute right-2 top-2 z-10 rounded-full bg-[#0e8f84] px-2 py-1 text-[10px] font-extrabold leading-none text-white">
            {discountPct}% OFF
          </span>
          {hasImage ? (
            <Image
              src={imageUrl}
              alt={deal.title}
              width={640}
              height={480}
              priority={priority}
              sizes="(max-width: 768px) 50vw, 22vw"
              className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center" aria-label="No product image">
              <DealImagePlaceholderIcon className="h-12 w-12 text-gray-300" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-3 py-3">
        <p className="text-[9px] font-bold uppercase tracking-wide text-[#0e8f84]">{categoryLabel}</p>
        <Link href={`/deals/${deal.id}`}>
          <h3 className="line-clamp-2 min-h-10 text-[1rem] font-semibold leading-tight text-[#0B1340] hover:text-[#0e8f84]">
            {deal.title}
          </h3>
        </Link>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-black leading-none text-[#0B1340]">{formatMoney(deal.discount_price)}</span>
          <span className="text-xs font-semibold text-gray-400 line-through">{formatMoney(deal.original_price)}</span>
        </div>
        <p className="text-[11px] text-gray-500">
          {storeLabel} <span className="font-semibold text-[#0e8f84]">{discountPct}% OFF</span>
        </p>
        <a
          href={deal.affiliate_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#0e8f84] text-sm font-bold text-white transition hover:bg-[#0b7a71]"
        >
          Get Deal
        </a>
      </div>
    </article>
  );
}
