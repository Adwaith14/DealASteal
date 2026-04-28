/** @vitest-environment jsdom */
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DealWithMerchantName } from '@/types/database.types';
import { FlashSalesSection } from './FlashSalesSection';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('@/components/marketing/FlashSaleCard', () => ({
  FlashSaleCard: ({ deal }: { deal: { title: string } }) => <div>{deal.title}</div>,
}));

afterEach(() => {
  cleanup();
});

function deal(id: string, title: string): DealWithMerchantName {
  return {
    id,
    merchant_id: 'm1',
    title,
    description: null,
    original_price: 100,
    discount_price: 80,
    discount_percentage: 20,
    affiliate_url: 'https://example.com/out',
    image_url: null,
    is_loot_deal: false,
    is_active: true,
    expires_at: null,
    created_at: '2026-01-01T12:00:00.000Z',
    category_slug: null,
    ingest_external_id: null,
    merchant_name: 'Test Store',
  };
}

describe('FlashSalesSection', () => {
  it('uses expiring-deals anchor id and Expiring Deals heading', () => {
    const { container } = render(<FlashSalesSection deals={[deal('1', 'One')]} />);
    const section = container.querySelector('#expiring-deals');
    expect(section).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Expiring Deals/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^View all$/i })).toHaveAttribute('href', '/deals');
  });
});
