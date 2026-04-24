import type { ReactNode } from 'react';

const LAYOUT_MAX = 'max-w-[2200px]';

type Props = {
  children: ReactNode;
  /** Tailwind classes for the center column wrapper (padding, vertical rhythm). */
  className?: string;
};

/**
 * Centers the feed and reserves symmetric side columns for future display ads (large screens).
 * Below ``lg`` the rails hide so mobile keeps full width.
 */
export function PageWithAdRails({ children, className = '' }: Props) {
  return (
    <div
      className={`mx-auto grid min-w-0 max-w-full ${LAYOUT_MAX} w-full flex-1 grid-cols-1 gap-2 sm:gap-3 lg:grid-cols-[minmax(0,25fr)_minmax(0,50fr)_minmax(0,25fr)] lg:gap-4 ${className}`}
    >
      <aside
        className="hidden min-h-[120px] rounded-lg border border-dashed border-gray-200 bg-[#ebebeb]/40 lg:block"
        aria-label="Advertisement area"
        data-ad-slot="left-rail"
        data-testid="ad-slot-left"
      />
      <div className="min-w-0 w-full">{children}</div>
      <aside
        className="hidden min-h-[120px] rounded-lg border border-dashed border-gray-200 bg-[#ebebeb]/40 lg:block"
        aria-label="Advertisement area"
        data-ad-slot="right-rail"
        data-testid="ad-slot-right"
      />
    </div>
  );
}
