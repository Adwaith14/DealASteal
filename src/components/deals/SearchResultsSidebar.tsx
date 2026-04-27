'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';
import {
  MAX_DEAL_PRICE_OPTIONS,
  MIN_DISCOUNT_PERCENT_OPTIONS,
} from '@/constants/deal-browse-filters';
import { DEAL_CATEGORY_NAV } from '@/constants/deal-categories';
import { buildDealListHref } from '@/utils/deal-feed-query';

const LIST_PATH = '/search';

type SearchResultsSidebarProps = {
  searchQuery: string;
  activeCategorySlug: string | null;
  activeMaxPrice: number | null;
  activeMinDiscount: number | null;
  activeLootOnly: boolean;
};

function checkboxClass(active: boolean): string {
  return [
    'inline-flex size-4 shrink-0 items-center justify-center rounded border transition',
    active ? 'border-[#0e8f84] bg-[#0e8f84] text-white' : 'border-gray-300 bg-white text-transparent',
  ].join(' ');
}

function FilterBlockTitle({ children }: { children: string }) {
  return <h3 className="text-sm font-bold text-[#0B1340]">{children}</h3>;
}

export function SearchResultsSidebar({
  searchQuery,
  activeCategorySlug,
  activeMaxPrice,
  activeMinDiscount,
  activeLootOnly,
}: SearchResultsSidebarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [categoryQuery, setCategoryQuery] = useState('');

  const buildHref = useCallback(
    (patch: {
      category?: string | null;
      maxPrice?: number | null;
      minDiscount?: number | null;
      loot?: boolean;
    }) => {
      const nextCategory =
        patch.category !== undefined ? patch.category ?? undefined : activeCategorySlug ?? undefined;
      const nextMax = patch.maxPrice !== undefined ? patch.maxPrice ?? undefined : activeMaxPrice ?? undefined;
      const nextMin =
        patch.minDiscount !== undefined ? patch.minDiscount ?? undefined : activeMinDiscount ?? undefined;
      const nextLoot = patch.loot !== undefined ? patch.loot : activeLootOnly;
      return buildDealListHref(LIST_PATH, {
        q: searchQuery || undefined,
        category: nextCategory,
        minDiscount: nextMin,
        maxPrice: nextMax,
        lootDeals: nextLoot || undefined,
      });
    },
    [activeCategorySlug, activeLootOnly, activeMaxPrice, activeMinDiscount, searchQuery]
  );

  const push = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router]
  );

  const clearHref = useMemo(
    () => buildDealListHref(LIST_PATH, { q: searchQuery || undefined }),
    [searchQuery]
  );

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) {
      return DEAL_CATEGORY_NAV;
    }
    return DEAL_CATEGORY_NAV.filter((c) => c.label.toLowerCase().includes(q) || c.slug.includes(q));
  }, [categoryQuery]);

  return (
    <aside className="px-1" aria-label="Search filters">
      <h2 className="text-lg font-black text-[#0B1340]">Filters</h2>

      <div className="mt-5 space-y-6">
        <section className="space-y-2">
          <FilterBlockTitle>Price range</FilterBlockTitle>
          <p className="text-[11px] text-gray-500">Max price (USD) — same catalog tiers as Hot Deals.</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => push(buildHref({ maxPrice: null }))}
              className={`h-9 min-w-0 flex-1 rounded-md border px-2 text-xs font-semibold ${
                activeMaxPrice == null
                  ? 'border-[#0e8f84] bg-[#0e8f84]/10 text-[#0B1340]'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              Any
            </button>
          </div>
          <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
            {MAX_DEAL_PRICE_OPTIONS.map((price) => {
              const active = activeMaxPrice === price;
              return (
                <button
                  key={price}
                  type="button"
                  disabled={pending}
                  onClick={() => push(buildHref({ maxPrice: active ? null : price }))}
                  className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs ${
                    active
                      ? 'border-[#0e8f84] bg-[#0e8f84]/10 text-[#0B1340]'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className={checkboxClass(active)} aria-hidden>
                    <svg className="size-3" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  Up to ${price}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <FilterBlockTitle>Categories</FilterBlockTitle>
          <label className="relative block">
            <span className="sr-only">Search categories</span>
            <input
              type="search"
              value={categoryQuery}
              onChange={(e) => setCategoryQuery(e.target.value)}
              placeholder="Search categories"
              className="h-9 w-full rounded-md border border-gray-300 bg-white pl-8 pr-2 text-xs outline-none ring-[#26BBA4] focus:border-[#26BBA4] focus:ring-1"
            />
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </label>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {filteredCategories.map(({ slug, label }) => {
              const active = activeCategorySlug === slug;
              return (
                <button
                  key={slug}
                  type="button"
                  disabled={pending}
                  onClick={() => push(buildHref({ category: active ? null : slug }))}
                  className="flex w-full items-center gap-2.5 text-left text-sm text-gray-700 hover:text-[#0B1340]"
                >
                  <span className={checkboxClass(active)} aria-hidden>
                    <svg className="size-3" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <FilterBlockTitle>Platforms</FilterBlockTitle>
          <p className="text-[11px] text-gray-500">Focus on flash-style loot deals (same as Hot Deals filter).</p>
          <button
            type="button"
            disabled={pending}
            onClick={() => push(buildHref({ loot: !activeLootOnly }))}
            className="flex w-full items-center gap-2.5 text-left text-sm text-gray-700 hover:text-[#0B1340]"
          >
            <span className={checkboxClass(activeLootOnly)} aria-hidden>
              <svg className="size-3" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            Hot / flash deals only
          </button>
        </section>

        <section className="space-y-2">
          <FilterBlockTitle>Deal strength</FilterBlockTitle>
          <p className="text-[11px] text-gray-500">Minimum discount % (maps to URL min_disc).</p>
          <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
            {MIN_DISCOUNT_PERCENT_OPTIONS.map((pct) => {
              const active = activeMinDiscount === pct;
              return (
                <button
                  key={pct}
                  type="button"
                  disabled={pending}
                  onClick={() => push(buildHref({ minDiscount: active ? null : pct }))}
                  className="flex w-full items-center gap-2.5 text-left text-sm text-gray-700 hover:text-[#0B1340]"
                >
                  <span className={checkboxClass(active)} aria-hidden>
                    <svg className="size-3" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  {pct}%+ off
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          disabled={pending}
          onClick={() => push(clearHref)}
          className="w-full rounded-md border border-gray-300 bg-[#f8fafb] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#0B1340] hover:bg-gray-100"
        >
          Clear all filters
        </button>
      </div>
    </aside>
  );
}
