import type { ReactNode } from 'react';

type HomeHeroSectionProps = {
  /** Filter row (e.g. ``HomeFilterBar``) rendered below the red band. */
  children?: ReactNode;
};

/**
 * Full-width hero + optional filter strip (GrabTheDeals-style home top).
 */
export function HomeHeroSection({ children }: HomeHeroSectionProps) {
  return (
    <div className="w-full min-w-0 max-w-full">
      <section
        className="w-full min-w-0 max-w-full overflow-x-clip border-b border-black/10 bg-[#D32F2F] text-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]"
        aria-labelledby="home-hero-heading"
      >
        <div className="mx-auto min-w-0 w-full max-w-[2200px] px-4 py-11 text-center sm:px-5 sm:py-14 md:py-16">
          <h1
            id="home-hero-heading"
            className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl"
          >
            {"Grab the Deals — Today's Best Coupons & Discounts"}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-normal leading-relaxed text-white/90 sm:text-base md:text-lg">
            Hand-picked deals from top stores, updated daily. Save more on every purchase.
          </p>
        </div>
      </section>
      {children ? (
        <div className="w-full min-w-0 max-w-full border-b border-gray-200 bg-[#f5f5f5] px-4 py-4 sm:px-5 md:py-5">
          <div className="mx-auto min-w-0 max-w-[2200px]">{children}</div>
        </div>
      ) : null}
    </div>
  );
}
