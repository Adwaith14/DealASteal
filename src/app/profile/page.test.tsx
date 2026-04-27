/** @vitest-environment jsdom */
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProfilePage from './page';

vi.mock('@/services/api/deals', () => ({
  getActiveDeals: async () => ({
    ok: true,
    deals: [
      {
        id: 'd1',
        merchant_id: 'm1',
        title: 'Premium ANC Headphones',
        description: null,
        original_price: 250,
        discount_price: 189,
        discount_percentage: 24.4,
        affiliate_url: 'https://example.com/deal',
        image_url: null,
        is_loot_deal: false,
        is_active: true,
        expires_at: null,
        created_at: '2026-04-25T00:00:00.000Z',
        category_slug: null,
        ingest_external_id: null,
      },
      {
        id: 'd2',
        merchant_id: 'm2',
        title: 'Professional SaaS Suite',
        description: null,
        original_price: 90,
        discount_price: 49,
        discount_percentage: 45.5,
        affiliate_url: 'https://example.com/deal2',
        image_url: null,
        is_loot_deal: false,
        is_active: true,
        expires_at: null,
        created_at: '2026-04-24T00:00:00.000Z',
        category_slug: null,
        ingest_external_id: null,
      },
    ],
  }),
}));

vi.mock('@/components/layout/SiteHeader', () => ({ SiteHeader: () => <div>Header</div> }));
vi.mock('@/components/layout/SiteFooter', () => ({ SiteFooter: () => <div>Footer</div> }));
vi.mock('@/components/layout/FloatingContact', () => ({ FloatingContact: () => <div>Contact</div> }));
vi.mock('@/components/layout/PageWithAdRails', () => ({
  PageWithAdRails: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

afterEach(() => {
  cleanup();
});

describe('/profile page', () => {
  it('renders welcome and account settings sections', async () => {
    const ui = await ProfilePage();
    render(ui);
    expect(screen.getByRole('heading', { name: /welcome back, alex/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /my saved deals/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /account settings/i })).toBeInTheDocument();
    expect(screen.getByText(/premium anc headphones/i)).toBeInTheDocument();
  });
});
