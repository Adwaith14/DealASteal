'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';

const categoryNav = [
  { href: '/deals?loot=1', label: 'Hot Deals' },
  { href: '/deals?category=tech', label: 'Electronics' },
  { href: '/deals?category=fashion', label: 'Fashion' },
  { href: '/deals?q=travel', label: 'Travel' },
] as const;

function isCategoryNavActive(
  pathname: string | null,
  search: URLSearchParams,
  href: string
): boolean {
  if (pathname !== '/deals') {
    return false;
  }
  try {
    const u = new URL(href, 'https://placeholder.local');
    const loot = u.searchParams.get('loot');
    const cat = u.searchParams.get('category');
    const q = u.searchParams.get('q');
    if (loot === '1' && search.get('loot') === '1') {
      return true;
    }
    if (cat && search.get('category')?.toLowerCase() === cat.toLowerCase()) {
      return search.get('loot') !== '1';
    }
    if (q && search.get('q')?.toLowerCase() === q.toLowerCase()) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function NavLinks({
  pathname,
  searchParams,
  className,
}: {
  pathname: string | null;
  searchParams: URLSearchParams;
  className?: string;
}) {
  return (
    <nav className={className} aria-label="Deal categories">
      {categoryNav.map(({ href, label }) => {
        const active = isCategoryNavActive(pathname, searchParams, href);
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex h-10 items-center whitespace-nowrap text-sm font-normal leading-none transition ${
              active ? 'font-medium text-[#26BBA4]' : 'text-gray-600 hover:text-[#0B1340]'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function IconActions({ className }: { className?: string }) {
  return (
    <div className={`flex h-10 shrink-0 items-center gap-0.5 sm:gap-1.5 ${className ?? ''}`}>
      <Link
        href="/#home-popular"
        className="flex size-10 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        aria-label="Saved picks"
      >
        <svg className="size-[1.35rem]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path d="M6 4h12v16l-6-4-6 4V4z" strokeLinejoin="round" />
        </svg>
      </Link>
      <Link
        href="/profile"
        className="flex size-10 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        aria-label="Account"
      >
        <svg className="size-[1.35rem]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5 20c1.8-4 12.2-4 14 0" strokeLinecap="round" />
        </svg>
      </Link>
    </div>
  );
}

function SiteHeaderFallback({ fullWidth }: { fullWidth?: boolean }) {
  return (
    <header
      role="banner"
      className="sticky top-0 z-50 w-full min-w-0 max-w-full border-b border-gray-200 bg-white shadow-sm"
    >
      <div
        className={`mx-auto h-14 animate-pulse px-4 sm:px-6 lg:px-8 ${
          fullWidth ? 'max-w-full' : 'max-w-[1400px]'
        }`}
      >
        <div className="h-full rounded-lg bg-gray-100" />
      </div>
    </header>
  );
}

function SiteHeaderInner({ fullWidth }: { fullWidth?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 w-full min-w-0 max-w-full border-b border-gray-200 bg-white shadow-sm"
    >
      <div
        className={`mx-auto min-w-0 px-4 py-2.5 sm:px-6 lg:px-8 lg:py-2.5 ${
          fullWidth ? 'max-w-full' : 'max-w-[1400px]'
        }`}
      >
        <div className="flex items-center justify-between lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-x-10 lg:gap-y-0 lg:[grid-template-areas:'logo_nav_actions']">
          <Link
            href="/"
            className="flex h-10 shrink-0 items-center text-[1.35rem] font-extrabold leading-none tracking-tight text-[#0B1340] transition"
          >
            AI Deals
          </Link>

          {/* Desktop Nav */}
          <NavLinks
            pathname={pathname}
            searchParams={searchParams}
            className="hidden lg:flex lg:justify-center lg:gap-x-10"
          />

          <div className="flex items-center gap-1 sm:gap-2">
            <IconActions />
            
            {/* Burger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex size-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
              aria-label="Toggle menu"
            >
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="border-t border-gray-100 py-3 lg:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {categoryNav.map(({ href, label }) => {
                const active = isCategoryNavActive(pathname, searchParams, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex h-12 items-center px-4 text-sm font-bold transition-all rounded-xl ${
                      active ? 'bg-[#26BBA4]/10 text-[#26BBA4]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              {/* Icons removed from here to keep them in the main header */}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export function SiteHeader({ fullWidth }: { fullWidth?: boolean }) {
  return (
    <Suspense fallback={<SiteHeaderFallback fullWidth={fullWidth} />}>
      <SiteHeaderInner fullWidth={fullWidth} />
    </Suspense>
  );
}
