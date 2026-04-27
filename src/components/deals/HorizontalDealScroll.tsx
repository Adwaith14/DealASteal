'use client';

import { useRef, useEffect, useState } from 'react';
import type { Deal } from '@/types/database.types';
import { DealCard } from './DealCard';

function ChevronLeft() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  deals: Deal[];
  /** Emoji or short icon */
  icon: string;
  title: string;
  subtitle: string;
  origin: string;
  /** Map of deal.id → coupon code to display on card */
  couponCodes?: Map<string, string>;
};

export function HorizontalDealScroll({ deals, icon, title, subtitle, origin, couponCodes }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScrollState) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro?.disconnect();
    };
  }, [deals]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  return (
    <section className="relative min-w-0 max-w-full py-4">
      {/* Section header */}
      <div className="mb-2.5 flex items-end justify-between">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-gray-900">
          <span aria-hidden>{icon}</span>
          {title}
        </h2>
        <p className="text-[11px] text-gray-500 sm:text-xs">{subtitle}</p>
      </div>

      {/* Scroll area with arrows */}
      <div className="relative -mx-0.5 min-w-0 max-w-full">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className={`absolute left-0 top-1/2 z-20 flex size-8 -translate-x-1 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 active:scale-95 ${
            deals.length > 0 && canScrollLeft ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <ChevronLeft />
        </button>

        {/* Cards container */}
        <div
          ref={scrollRef}
          className="scrollbar-deals flex gap-2.5 overflow-x-auto overscroll-x-contain px-0.5 pb-3.5 scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}
        >
          {deals.length === 0 ? (
            <div className="w-full rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
              No deals available in this section right now.
            </div>
          ) : (
            deals.map((deal, i) => (
              <div
                key={deal.id}
                className="w-[158px] min-w-0 flex-none snap-start sm:w-[172px] lg:w-[178px]"
              >
                <DealCard
                  deal={deal}
                  priority={i < 4}
                  dealPageUrl={`${origin}/deals/${deal.id}`}
                  couponCode={couponCodes?.get(deal.id)}
                />
              </div>
            ))
          )}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className={`absolute right-0 top-1/2 z-20 flex size-8 translate-x-1 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 active:scale-95 ${
            deals.length > 0 && canScrollRight ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}
