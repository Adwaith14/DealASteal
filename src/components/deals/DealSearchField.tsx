'use client';

import type { DealListBasePath } from '@/utils/deal-feed-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';

type DealSearchFieldProps = {
  initialQuery: string;
  /** Where debounced text searches navigate (Phase 17 ``/search``). */
  resultsBasePath?: DealListBasePath;
  /** Optional class for the outer wrapper (navbar vs mobile strip). */
  className?: string;
  /**
   * ``nav`` — white field + gray border (top bar). ``default`` — softer gray fill for in-page use.
   */
  variant?: 'default' | 'nav';
};

/**
 * Debounced search synced to URL query params (server-driven browse / FTS).
 */
export function DealSearchField({
  initialQuery,
  resultsBasePath = '/search',
  className,
  variant = 'default',
}: DealSearchFieldProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const skipNextDebounce = useRef(true);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const pushQuery = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = next.trim();
      if (trimmed) {
        params.set('q', trimmed);
      } else {
        params.delete('q');
      }
      params.delete('page');
      const qs = params.toString();
      startTransition(() => {
        if (trimmed) {
          router.push(qs ? `${resultsBasePath}?${qs}` : resultsBasePath);
          return;
        }
        if (qs) {
          router.push(`${pathname || '/'}?${qs}`);
        } else {
          router.push(pathname === '/search' ? '/' : pathname || '/');
        }
      });
    },
    [pathname, resultsBasePath, router, searchParams]
  );

  useEffect(() => {
    if (skipNextDebounce.current) {
      skipNextDebounce.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      pushQuery(value);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [value, pushQuery]);

  return (
    <div className={className}>
      <label className="relative block w-full">
        <span className="sr-only">Search deals</span>
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search deals, stores..."
          autoComplete="off"
          spellCheck={false}
          className={
            variant === 'nav'
              ? 'w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-500 focus:border-gray-400 focus:ring-2 focus:ring-red-100 disabled:opacity-60'
              : 'w-full rounded-lg border border-gray-200 bg-[#f5f5f5] py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-inner outline-none transition placeholder:text-gray-500 focus:border-gray-300 focus:bg-white focus:shadow-sm focus:ring-2 focus:ring-red-100 disabled:opacity-60'
          }
          aria-busy={isPending}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </span>
      </label>
    </div>
  );
}
