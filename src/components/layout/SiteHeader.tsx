'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { DealSearchField } from '@/components/deals/DealSearchField';

function SearchFallback() {
  return (
    <div
      className="h-11 w-full max-w-2xl animate-pulse rounded-lg border border-gray-200 bg-[#f5f5f5]"
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

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-8 lg:px-8">
        <a href="/" className="flex shrink-0 items-center gap-2.5 lg:min-w-[11rem]">
          <span
            className="flex size-10 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm"
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
          <span className="text-xl font-extrabold tracking-tight text-gray-900">
            DealA<span className="text-red-600">Steal</span>
          </span>
        </a>

        <div className="order-3 min-w-0 w-full flex-1 lg:order-2 lg:flex lg:justify-center">
          <Suspense fallback={<SearchFallback />}>
            <DealSearchField
              initialQuery={initialSearchQuery}
              className="mx-auto w-full max-w-2xl lg:mx-0"
            />
          </Suspense>
        </div>

        <nav
          className="order-2 flex flex-wrap items-center justify-center gap-1 sm:justify-end lg:order-3 lg:ml-auto lg:shrink-0"
          aria-label="Main navigation"
        >
          {nav.map(({ href, label }) => {
            const active = isNavActive(pathname, href, label);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-red-50 text-red-700 ring-1 ring-red-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
