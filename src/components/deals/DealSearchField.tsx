'use client';

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
  /** Optional class for the outer wrapper (navbar vs mobile strip). */
  className?: string;
  /** Overrides default placeholder copy. */
  placeholder?: string;
  /**
   * ``nav`` — white field + gray border (top bar). ``default`` — softer gray fill for in-page use.
   */
  variant?: 'default' | 'nav';
  /** Dark footer-colored navbar: translucent field until focus. */
  navOnDark?: boolean;
};

/**
 * Debounced title search synced to ``?q=`` on the home route (server-driven results).
 */
export function DealSearchField({
  initialQuery,
  className,
  placeholder,
  variant = 'default',
  navOnDark = false,
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
        router.push(qs ? `${pathname}?${qs}` : pathname || '/');
      });
    },
    [pathname, router, searchParams]
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
      <label className="group relative block w-full">
        <span className="sr-only">Search deals by title</span>
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder ?? 'Search deals, stores...'}
          autoComplete="off"
          spellCheck={false}
          className={
            variant === 'nav' && navOnDark
              ? 'box-border h-10 w-full rounded-full border border-white/25 bg-white/10 py-0 pl-10 pr-4 text-left text-sm font-normal leading-10 text-white outline-none transition placeholder:text-white/55 focus:border-[#26BBA4]/60 focus:bg-white focus:text-[#0B1340] focus:placeholder:text-gray-500 focus:ring-1 focus:ring-[#26BBA4]/30 disabled:opacity-60'
              : variant === 'nav'
                ? 'box-border h-10 w-full rounded-full border border-gray-200/90 bg-[#eef0f3] py-0 pl-10 pr-4 text-left text-sm font-normal leading-10 text-[#0B1340] outline-none transition placeholder:text-gray-500 focus:border-[#26BBA4]/50 focus:bg-white focus:ring-1 focus:ring-[#26BBA4]/30 disabled:opacity-60'
                : 'w-full rounded-lg border border-gray-200 bg-[#f5f5f5] py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-inner outline-none transition placeholder:text-gray-500 focus:border-gray-300 focus:bg-white focus:shadow-sm focus:ring-2 focus:ring-[#26BBA4]/20 disabled:opacity-60'
          }
          aria-busy={isPending}
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute left-3.5 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center ${
            variant === 'nav' && navOnDark ? 'text-white/55 group-focus-within:text-gray-500' : 'text-gray-500'
          }`}
        >
          <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
