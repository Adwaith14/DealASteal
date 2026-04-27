/** @vitest-environment jsdom */
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchResultsPage from './page';

vi.mock('@/services/api/deals', () => ({
  getActiveDeals: async () => ({
    ok: true,
    deals: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        merchant_id: 'm1',
        title: 'Test Deal One',
        description: null,
        original_price: 100,
        discount_price: 79,
        discount_percentage: 21,
        affiliate_url: 'https://amazon.com/x',
        image_url: null,
        is_loot_deal: false,
        is_active: true,
        expires_at: null,
        created_at: '2026-04-25T00:00:00.000Z',
        category_slug: 'tech',
        ingest_external_id: null,
      },
    ],
    page: 1,
    pageSize: 12,
    totalCount: 1,
    totalPages: 1,
    appliedQuery: 'usb',
    appliedCategorySlug: null,
    appliedStore: null,
    appliedMinDiscount: null,
    appliedMaxPrice: null,
    appliedLootOnly: false,
    appliedSort: null,
  }),
}));

vi.mock('@/components/layout/SiteHeader', () => ({
  SiteHeader: () => <div>Header</div>,
}));
vi.mock('@/components/layout/SiteFooter', () => ({
  SiteFooter: () => <div>Footer</div>,
}));
vi.mock('@/components/layout/FloatingContact', () => ({
  FloatingContact: () => <div>Contact</div>,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

describe('SearchResultsPage', () => {
  it(
    'renders filters sidebar and search heading for q param',
    async () => {
    const ui = await SearchResultsPage({
      searchParams: Promise.resolve({ q: 'usb', page: '1' }),
    });
    render(ui);

    expect(screen.getByRole('heading', { name: /^Filters$/i })).toBeInTheDocument();
    const form = screen.getByRole('search');
    expect(form).toHaveAttribute('action', '/search');
    expect(screen.getByRole('searchbox', { name: /Search deals/i })).toHaveValue('usb');
    expect(screen.getByText(/Search results for/u)).toBeInTheDocument();
    expect(screen.getByText(/Test Deal One/u)).toBeInTheDocument();
    },
    15_000
  );
});
