import type { ReactNode } from 'react';

const LAYOUT_MAX = 'max-w-[1400px]';

type Props = {
  children: ReactNode;
  /** Tailwind classes for the center column wrapper (padding, vertical rhythm). */
  className?: string;
};

/**
 * Single full-width content wrapper (no side ad rails).
 */
export function PageWithAdRails({ children, className = '' }: Props) {
  return (
    <div className={`mx-auto min-w-0 max-w-full ${LAYOUT_MAX} w-full flex-1 bg-white`}>
      <div
        className={`min-w-0 w-full px-10 sm:px-15 md:px-20 lg:px-40 xl:px-60 2xl:px-70 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
