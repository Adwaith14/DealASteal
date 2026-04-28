'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import {
  type CatalogSortMode,
  MAX_DEAL_PRICE_OPTIONS,
} from '@/constants/deal-browse-filters';
import { DEAL_CATEGORY_NAV } from '@/constants/deal-categories';
import { buildDealListHref } from '@/utils/deal-feed-query';

type DealsCatalogSidebarProps = {
  searchQuery: string;
  activeCategorySlug: string | null;
  activeMaxPrice: number | null;
  activeLootOnly: boolean;
  activeSort: CatalogSortMode | null;
};

function SidebarSectionTitle({ children }: { children: string }) {
  return <h3 className="text-[11px] font-black uppercase tracking-wider text-[#0B1340]">{children}</h3>;
}

function checkboxBaseClass(active: boolean): string {
  return [
    'inline-flex size-4 items-center justify-center rounded border transition',
    active ? 'border-[#0e8f84] bg-[#0e8f84] text-white' : 'border-gray-300 bg-white text-transparent',
  ].join(' ');
}

export function DealsCatalogSidebar({
  searchQuery,
  activeCategorySlug,
  activeMaxPrice,
  activeLootOnly,
  activeSort,
}: DealsCatalogSidebarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const buildHref = useCallback(
    (patch: {
      category?: string | null;
      maxPrice?: number | null;
      loot?: boolean;
      sort?: CatalogSortMode | null;
    }) => {
      return buildDealListHref('/deals', {
        q: searchQuery || undefined,
        category:
          patch.category !== undefined ? patch.category ?? undefined : activeCategorySlug ?? undefined,
        maxPrice: patch.maxPrice !== undefined ? patch.maxPrice ?? undefined : activeMaxPrice ?? undefined,
        lootDeals: patch.loot !== undefined ? patch.loot : activeLootOnly || undefined,
        sort: patch.sort !== undefined ? patch.sort ?? undefined : activeSort ?? undefined,
      });
    },
    [activeCategorySlug, activeLootOnly, activeMaxPrice, activeSort, searchQuery]
  );

  const pushHref = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router]
  );

  const clearFiltersHref = buildDealListHref('/deals', {
    q: searchQuery || undefined,
  });

  return (
    <aside className="px-1" aria-label="Deals filters">
      <div className="space-y-5">
        <section>
          <h2 className="text-lg font-black text-[#0B1340]">Categories</h2>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">Filter by interest</p>
          <div className="mt-3 space-y-2.5">
            {DEAL_CATEGORY_NAV.map(({ slug, label }) => {
              const active = activeCategorySlug === slug;
              return (
                <button
                  key={slug}
                  type="button"
                  aria-pressed={active}
                  disabled={pending}
                  onClick={() => pushHref(buildHref({ category: active ? null : slug }))}
                  className="flex w-full items-center gap-2.5 text-left text-sm text-gray-700 hover:text-[#0B1340]"
                >
                  <span className={checkboxBaseClass(active)} aria-hidden>
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
          <SidebarSectionTitle>Price Range</SidebarSectionTitle>
          <div className="space-y-2 text-xs">
            <button
              type="button"
              disabled={pending}
              onClick={() => pushHref(buildHref({ maxPrice: null }))}
              className={`h-9 w-full rounded-md border text-left px-2.5 ${
                activeMaxPrice == null
                  ? 'border-[#0e8f84] bg-[#0e8f84]/10 text-[#0B1340]'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              Any
            </button>
            {MAX_DEAL_PRICE_OPTIONS.map((price) => (
              <button
                key={price}
                type="button"
                disabled={pending}
                onClick={() => pushHref(buildHref({ maxPrice: price }))}
                className={`h-9 w-full rounded-md border text-left px-2.5 ${
                  activeMaxPrice === price
                    ? 'border-[#0e8f84] bg-[#0e8f84]/10 text-[#0B1340]'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Up to ${price}
              </button>
            ))}
          </div>
        </section>

        <section>
          <button
            type="button"
            disabled={pending}
            onClick={() => pushHref(clearFiltersHref)}
            className="w-full rounded-md border border-gray-300 bg-[#f8fafb] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#0B1340] hover:bg-gray-100"
          >
            Clear all filters
          </button>
        </section>

        <section className="border-t border-gray-200 pt-4 text-sm text-gray-600">
          <a href="/blog" className="block py-1.5 hover:text-[#0B1340]">
            Help Center
          </a>
          <a href="/contact" className="block py-1.5 hover:text-[#0B1340]">
            Contact
          </a>
        </section>
      </div>
    </aside>
  );
}
