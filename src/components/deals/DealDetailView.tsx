import Image from 'next/image';
import Link from 'next/link';
import { formatCategoryLabel } from '@/components/deals/DealCategoryFilter';
import { DealImagePlaceholderIcon } from '@/components/deals/deal-image-placeholder';
import { DealShareRow } from '@/components/deals/DealShareRow';
import { isDealCategorySlug } from '@/constants/deal-categories';
import type { Deal } from '@/types/database.types';
import { storeLabelFromAffiliateUrl } from '@/utils/affiliate-display';
import { getDealUrgencyForDisplay } from '@/utils/deal-pdp-urgency';
import { buildHomeDealListHref } from '@/utils/deal-feed-query';
import { formatDealEndsIn, formatDealListedAgo } from '@/utils/deal-time';

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function truncateCrumbTitle(title: string, max = 44): string {
  const t = title.trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

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

function barColor(bar: 'red' | 'orange' | 'green'): string {
  if (bar === 'red') {
    return 'bg-red-600';
  }
  if (bar === 'orange') {
    return 'bg-orange-500';
  }
  return 'bg-emerald-500';
}

type DealDetailViewProps = {
  deal: Deal;
  dealPageUrl: string;
};

export function DealDetailView({ deal, dealPageUrl }: DealDetailViewProps) {
  const discountPct = Math.round(deal.discount_percentage);
  const discountLabel = `${discountPct}% OFF`;
  const imageUrl = deal.image_url?.trim() ?? '';
  const hasImage = imageUrl.length > 0;
  const listed = formatDealListedAgo(deal.created_at);
  const endsIn = formatDealEndsIn(deal.expires_at);
  const storeLabel = storeLabelFromAffiliateUrl(deal.affiliate_url);
  const categoryLabel = formatCategoryLabel(deal.category_slug);
  const savings = Math.max(0, deal.original_price - deal.discount_price);
  const urgency = getDealUrgencyForDisplay(deal);
  const crumbCategory =
    deal.category_slug && isDealCategorySlug(deal.category_slug) && categoryLabel
      ? categoryLabel.toUpperCase()
      : null;
  const categoryHref =
    deal.category_slug && isDealCategorySlug(deal.category_slug)
      ? buildHomeDealListHref({ category: deal.category_slug })
      : null;

  const faqs = [
    {
      q: `How much can I save on ${deal.title.slice(0, 80)}${deal.title.length > 80 ? '…' : ''}?`,
      a: `This listing shows about ${discountLabel.toLowerCase()} off the reference price we captured. Your final price is set by the retailer at checkout.`,
    },
    {
      q: 'Is this deal verified?',
      a: 'We validate links, titles, and basic price consistency before publishing. Always confirm price and availability on the store page before you buy.',
    },
    {
      q: 'How do I redeem this deal?',
      a: 'Use Grab the Deal to open the retailer site. Discounts usually apply automatically; some offers require a coupon code shown on the merchant page.',
    },
    {
      q: 'When does this deal expire?',
      a: endsIn
        ? 'We show a countdown when an expiry time is available. Offers can end early if inventory runs out.'
        : 'We may not have an exact end time. Retailers can change or end promotions without notice.',
    },
    {
      q: 'Can I share this deal?',
      a: 'Yes — use the share icons below to send the link to friends or save it for later.',
    },
  ];

  const retailerName = storeLabel;

  return (
    <div className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-6 sm:px-6 lg:py-10">
      <nav className="mb-6 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-gray-500">
        <Link href="/" className="font-medium text-gray-700 hover:text-red-600">
          Home
        </Link>
        <span className="text-gray-300" aria-hidden>
          &gt;
        </span>
        {crumbCategory && categoryHref ? (
          <>
            <Link href={categoryHref} className="font-medium text-gray-700 hover:text-red-600">
              {crumbCategory}
            </Link>
            <span className="text-gray-300" aria-hidden>
              &gt;
            </span>
          </>
        ) : null}
        <span className="max-w-[min(100%,52vw)] truncate font-medium text-gray-600">
          {truncateCrumbTitle(deal.title)}
        </span>
      </nav>

      <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-2 lg:gap-0">
          <div className="relative flex min-h-[280px] items-center justify-center border-b border-gray-100 bg-white p-6 lg:min-h-[420px] lg:border-b-0 lg:border-r">
            <span className="absolute left-4 top-4 z-20 inline-flex max-w-[calc(100%-2rem)] items-center rounded-md bg-orange-500 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow">
              {deal.is_loot_deal ? <span aria-hidden>🔥 </span> : null}
              {discountLabel}
            </span>
            {hasImage ? (
              <div className="relative aspect-square w-full max-w-md lg:max-w-none">
                <Image
                  src={imageUrl}
                  alt={deal.title}
                  fill
                  priority
                  className="object-contain drop-shadow-sm"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div
                className="flex aspect-square w-full max-w-md items-center justify-center rounded-lg bg-gray-50 lg:max-w-lg"
                aria-label="No product image"
              >
                <DealImagePlaceholderIcon className="h-24 w-24 text-gray-300" />
              </div>
            )}
          </div>

          <div className="space-y-5 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-800">
                {storeLabel}
              </span>
              {categoryLabel ? (
                <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-800">
                  {categoryLabel}
                </span>
              ) : null}
            </div>

            <h1 className="text-balance text-2xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-3xl">
              {deal.title}
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <ClockIcon className="size-3.5 text-gray-400" />
              {listed}
            </p>

            {deal.description ? (
              <p className="text-pretty text-sm leading-relaxed text-gray-600 sm:text-base">
                {deal.description}
              </p>
            ) : (
              <p className="text-pretty text-sm leading-relaxed text-gray-600 sm:text-base">
                Limited-time offer: save about {discountLabel.toLowerCase()} at {retailerName} through our
                affiliate link. See the retailer&apos;s page for full specs and reviews.
              </p>
            )}

            <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border-t border-gray-100 pt-5">
              <span className="text-3xl font-black tabular-nums text-emerald-600 sm:text-4xl">
                {moneyFormatter.format(deal.discount_price)}
              </span>
              <span className="text-lg text-gray-400 line-through">
                {moneyFormatter.format(deal.original_price)}
              </span>
              <span className="text-base font-extrabold text-gray-900">{discountLabel}</span>
            </div>
            <p className="text-sm text-gray-600">
              Est. savings:{' '}
              <span className="font-semibold text-gray-900">{moneyFormatter.format(savings)}</span>
            </p>
            <p className="text-[10px] text-gray-400">Prices may vary</p>

            <div>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs font-bold">
                <span
                  className={
                    urgency.bar === 'red'
                      ? 'text-red-600'
                      : urgency.bar === 'orange'
                        ? 'text-orange-600'
                        : 'text-emerald-700'
                  }
                >
                  {urgency.label}
                </span>
                <span className="tabular-nums text-gray-500">{urgency.percent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${barColor(urgency.bar)}`}
                  style={{ width: `${urgency.percent}%` }}
                />
              </div>
            </div>

            {endsIn ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
                <ClockIcon className="size-4 shrink-0" />
                {endsIn}
              </div>
            ) : null}

            <a
              href={deal.affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-6 text-center text-base font-bold text-white shadow-md transition hover:from-orange-600 hover:to-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            >
              Grab the Deal
              <ExternalIcon className="size-5" />
            </a>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-center text-sm text-gray-600">
              <div>
                <p className="text-2xl font-black text-gray-900">0</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Clicks</p>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">0</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Shares</p>
              </div>
            </div>
          </div>
        </div>
      </article>

      <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-gray-500">
        As an Amazon Associate, we earn from qualifying purchases. Prices and availability are subject to
        change.{' '}
        <Link href="/#affiliate" className="text-red-600 underline hover:text-red-700">
          Affiliate disclosure
        </Link>
      </p>

      <section className="mx-auto mt-8 max-w-3xl rounded-xl border border-gray-900 bg-white px-5 py-6 shadow-sm sm:px-8">
        <h2 className="text-center text-sm font-extrabold uppercase tracking-wide text-gray-900">
          Share this deal
        </h2>
        <div className="mt-5 flex justify-center border-t border-gray-100 pt-5">
          <DealShareRow
            dealPageUrl={dealPageUrl}
            title={deal.title}
            includePinterest
            variant="panel"
          />
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-3xl rounded-xl border border-gray-900 bg-[#f9fafb] px-5 py-6 sm:px-8">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-gray-900">
          <ExternalIcon className="size-5 shrink-0 text-emerald-600" />
          How to redeem this deal
        </h2>
        <ol className="mt-5 space-y-4">
          {[
            `Click “Grab the Deal” above to visit ${retailerName} in a new tab.`,
            'Confirm the discounted price on the product page before you add to cart.',
            'Complete checkout on the retailer’s site. Returns and support are handled by the merchant.',
          ].map((text, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-gray-700">
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-black text-white"
                aria-hidden
              >
                {i + 1}
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-10 max-w-3xl">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-gray-900">
          <span
            className="flex size-8 items-center justify-center rounded-full border-2 border-red-600 text-sm font-black text-red-600"
            aria-hidden
          >
            ?
          </span>
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {faqs.map((item, index) => (
            <details
              key={index}
              className="group rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              <summary className="cursor-pointer list-none text-sm font-bold text-gray-900 [&::-webkit-details-marker]:hidden">
                <span className="mr-2 text-gray-500" aria-hidden>
                  ▸
                </span>
                {item.q}
              </summary>
              <p className="mt-3 border-t border-gray-100 pt-3 text-sm leading-relaxed text-gray-600">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-center gap-3 sm:flex-row">
        {deal.category_slug && isDealCategorySlug(deal.category_slug) && categoryLabel ? (
          <Link
            href={buildHomeDealListHref({ category: deal.category_slug })}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-gray-900 bg-white px-6 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-gray-50 sm:w-auto"
          >
            More {categoryLabel} deals
          </Link>
        ) : null}
        <Link
          href="/"
          className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-gray-900 bg-white px-6 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-gray-50 sm:w-auto"
        >
          ← All deals
        </Link>
      </div>
    </div>
  );
}
