'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import {
  DEAL_STORE_FILTER_KEYS,
  DEAL_STORE_LABELS,
  MAX_DEAL_PRICE_OPTIONS,
  MIN_DISCOUNT_PERCENT_OPTIONS,
  type DealStoreFilterKey,
} from '@/constants/deal-browse-filters';
import { DEAL_CATEGORY_NAV } from '@/constants/deal-categories';
import { buildHomeDealListHref } from '@/utils/deal-feed-query';

type HomeFilterBarProps = {
  searchQuery: string;
  activeCategorySlug: string | null;
  activeStore: DealStoreFilterKey | null;
  activeMinDiscount: number | null;
  activeMaxPrice: number | null;
};

const selectClass =
  'w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-gray-800 shadow-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200';
const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

/**
 * Home feed facet row (category, store, min discount, max price) — all drive URL query params.
 */
export function HomeFilterBar({
  searchQuery,
  activeCategorySlug,
  activeStore,
  activeMinDiscount,
  activeMaxPrice,
}: HomeFilterBarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const buildHref = useCallback(
    (patch: {
      category?: string | null;
      store?: DealStoreFilterKey | null;
      minDiscount?: number | null;
      maxPrice?: number | null;
    }) => {
      const trimmed = searchQuery.trim();
      const category =
        patch.category !== undefined
          ? patch.category || undefined
          : activeCategorySlug ?? undefined;
      const store =
        patch.store !== undefined
          ? patch.store ?? undefined
          : activeStore ?? undefined;
      const minDiscount =
        patch.minDiscount !== undefined
          ? patch.minDiscount ?? undefined
          : activeMinDiscount ?? undefined;
      const maxPrice =
        patch.maxPrice !== undefined ? patch.maxPrice ?? undefined : activeMaxPrice ?? undefined;
      return buildHomeDealListHref({
        q: trimmed || undefined,
        category,
        store,
        minDiscount,
        maxPrice,
      });
    },
    [activeCategorySlug, activeMaxPrice, activeMinDiscount, activeStore, searchQuery]
  );

  const pushHref = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router]
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block" htmlFor="home-filter-category">
        <span className="sr-only">Category</span>
        <select
          id="home-filter-category"
          aria-busy={pending}
          className={selectClass}
          style={{
            backgroundImage: chevron,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.6rem center',
            backgroundSize: '1.1rem',
          }}
          value={activeCategorySlug ?? ''}
          onChange={(e) => pushHref(buildHref({ category: e.target.value || null }))}
        >
          <option value="">All Categories</option>
          {DEAL_CATEGORY_NAV.map(({ slug, label }) => (
            <option key={slug} value={slug}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="block" htmlFor="home-filter-store">
        <span className="sr-only">Stores</span>
        <select
          id="home-filter-store"
          aria-busy={pending}
          className={selectClass}
          style={{
            backgroundImage: chevron,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.6rem center',
            backgroundSize: '1.1rem',
          }}
          value={activeStore ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            pushHref(
              buildHref({
                store: v ? (v as DealStoreFilterKey) : null,
              })
            );
          }}
        >
          <option value="">All Stores</option>
          {DEAL_STORE_FILTER_KEYS.map((key) => (
            <option key={key} value={key}>
              {DEAL_STORE_LABELS[key]}
            </option>
          ))}
        </select>
      </label>

      <label className="block" htmlFor="home-filter-discount">
        <span className="sr-only">Discount</span>
        <select
          id="home-filter-discount"
          aria-busy={pending}
          className={selectClass}
          style={{
            backgroundImage: chevron,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.6rem center',
            backgroundSize: '1.1rem',
          }}
          value={activeMinDiscount != null ? String(activeMinDiscount) : ''}
          onChange={(e) => {
            const v = e.target.value;
            pushHref(
              buildHref({
                minDiscount: v ? Number.parseInt(v, 10) : null,
              })
            );
          }}
        >
          <option value="">Any Discount</option>
          {MIN_DISCOUNT_PERCENT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}%+ off
            </option>
          ))}
        </select>
      </label>

      <label className="block" htmlFor="home-filter-price">
        <span className="sr-only">Price</span>
        <select
          id="home-filter-price"
          aria-busy={pending}
          className={selectClass}
          style={{
            backgroundImage: chevron,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.6rem center',
            backgroundSize: '1.1rem',
          }}
          value={activeMaxPrice != null ? String(activeMaxPrice) : ''}
          onChange={(e) => {
            const v = e.target.value;
            pushHref(
              buildHref({
                maxPrice: v ? Number.parseInt(v, 10) : null,
              })
            );
          }}
        >
          <option value="">Any Price</option>
          {MAX_DEAL_PRICE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {`Under $${n}`}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
