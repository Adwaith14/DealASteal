import type { ReactNode } from 'react';
import { FloatingContact } from '@/components/layout/FloatingContact';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';

type MarketingShellProps = {
  children: ReactNode;
};

export function MarketingShell({ children }: MarketingShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f5] text-gray-900">
      <SiteHeader />
      {children}
      <SiteFooter />
      <FloatingContact />
    </div>
  );
}
