import type { ReactNode } from 'react';
import { FloatingContact } from '@/components/layout/FloatingContact';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';

type MarketingShellProps = {
  children: ReactNode;
  /** Search box initial value; marketing pages pass empty string. */
  initialSearchQuery?: string;
};

export function MarketingShell({
  children,
  initialSearchQuery = '',
}: MarketingShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f5] text-gray-900">
      <SiteHeader initialSearchQuery={initialSearchQuery} />
      {children}
      <SiteFooter />
      <FloatingContact />
    </div>
  );
}
