'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { DealSearchField } from '@/components/deals/DealSearchField';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

function SearchFallback() {
  return (
    <div
      className="h-11 w-full animate-pulse rounded-lg border border-gray-300 bg-white"
      aria-hidden
    />
  );
}

type SiteHeaderProps = {
  initialSearchQuery: string;
};

const nav = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
] as const;

function isNavActive(pathname: string | null, href: string, label: string): boolean {
  if (pathname == null) {
    return label === 'Home';
  }
  if (label === 'Home') {
    return pathname === '/';
  }
  if (label === 'Blog') {
    return pathname === '/blog' || pathname.startsWith('/blog/');
  }
  return pathname === href;
}

export function SiteHeader({ initialSearchQuery }: SiteHeaderProps) {
  const pathname = usePathname();
  const [authEmail, setAuthEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthEmail(null);
      return;
    }
    void supabase.auth.getUser().then(({ data }) => {
      setAuthEmail(data.user?.email ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void supabase.auth.getUser().then(({ data }) => {
        setAuthEmail(data.user?.email ?? null);
      });
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full min-w-0 max-w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex min-w-0 w-full max-w-[2200px] flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex items-center justify-between gap-3 lg:contents lg:gap-0">
          <a
            href="/"
            className="order-1 flex shrink-0 items-center gap-2.5 lg:order-1 lg:min-w-[11rem]"
          >
            <span
              className="flex size-10 items-center justify-center rounded-lg bg-[#D32F2F] text-white shadow-sm"
              aria-hidden
            >
              <svg className="size-6" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7V5a2 2 0 012-2h2m0 0h8m0 0h2a2 2 0 012 2v2M4 7h16M4 7l1 12a2 2 0 002 1.9h10a2 2 0 002-1.9L20 7M9 11v2m6-2v2"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-lg font-extrabold tracking-tight text-gray-900 sm:text-xl">
              DealA<span className="text-[#D32F2F]">Steal</span>
            </span>
          </a>

          <nav
            className="order-2 flex shrink-0 flex-wrap items-center justify-end gap-0.5 sm:gap-1 lg:order-3"
            aria-label="Main navigation"
          >
            {nav.map(({ href, label }) => {
              const active = isNavActive(pathname, href, label);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-md px-2.5 py-2 text-sm font-semibold transition sm:px-3 ${
                    active
                      ? 'text-[#D32F2F]'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            {authEmail === undefined ? (
              <span className="px-2.5 py-2 text-xs font-medium text-gray-400 sm:px-3" aria-hidden>
                …
              </span>
            ) : authEmail ? (
              <Link
                href="/account"
                className="rounded-md px-2.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 sm:px-3"
              >
                Account
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-md px-2.5 py-2 text-sm font-semibold text-[#D32F2F] transition hover:bg-red-50 sm:px-3"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>

        <div className="order-3 min-w-0 w-full lg:order-2 lg:flex lg:flex-1 lg:justify-center">
          <Suspense fallback={<SearchFallback />}>
            <DealSearchField
              initialQuery={initialSearchQuery}
              variant="nav"
              className="w-full max-w-2xl"
            />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
