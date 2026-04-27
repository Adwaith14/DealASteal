import Link from 'next/link';
import { DEAL_CATEGORY_NAV } from '@/constants/deal-categories';
import { buildHomeDealListHref } from '@/utils/deal-feed-query';

/**
 * Native ``details`` menu (no client JS) for quick category jumps from the navbar.
 */
export function NavbarCategoriesMenu() {
  return (
    <details className="group relative">
      <summary className="list-none cursor-pointer rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition marker:content-none hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF9900] [&::-webkit-details-marker]:hidden sm:px-3.5 sm:py-2">
        <span className="inline-flex items-center gap-1">
          Categories
          <span aria-hidden className="text-xs text-gray-300">
            ▾
          </span>
        </span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 min-w-[12rem] overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5">
        <Link
          href={buildHomeDealListHref({})}
          className="block px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          All deals
        </Link>
        {DEAL_CATEGORY_NAV.map(({ slug, label }) => (
          <Link
            key={slug}
            href={buildHomeDealListHref({ category: slug })}
            className="block px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            {label}
          </Link>
        ))}
      </div>
    </details>
  );
}
