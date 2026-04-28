import type { ReactNode } from 'react';

type HomeHeroSectionProps = {
  /** Filter row (e.g. ``HomeFilterBar``) for browse/search mode. */
  children?: ReactNode;
};

/**
 * Browse/search mode: light strip below header (marketing hero is on the default home only).
 */
export function HomeHeroSection({ children }: HomeHeroSectionProps) {
  if (!children) {
    return null;
  }
  return (
    <div className="w-full min-w-0 max-w-full border-b border-gray-200 bg-[#f3f4f6]">
      <div className="mx-auto min-w-0 w-full max-w-[1400px] px-4 py-4 sm:px-5 md:py-5">{children}</div>
    </div>
  );
}
