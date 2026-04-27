/** @vitest-environment jsdom */
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DealWithMerchantName } from '@/types/database.types';
import { CuratedDealGridSection } from './CuratedDealGridSection';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => (
    <img alt="" src={typeof props.src === 'string' ? props.src : ''} data-testid="card-img" />
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
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

describe('CuratedDealGridSection', () => {
  it('loads more deals in place when See more is clicked', async () => {
    const initial = [deal('a1', 'First')];
    const expanded = [deal('a1', 'First'), deal('a2', 'Second')];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, deals: expanded }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <CuratedDealGridSection
        id="home-popular"
        headingId="h1"
        label="Popular"
        mode="popular"
        initialDeals={initial}
      />
    );

    const region = screen.getByRole('region', { name: /^Popular$/i });
    expect(within(region).getByText('First')).toBeInTheDocument();
    expect(within(region).queryByText('Second')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^See more$/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/deals\/curated\?sort=popular&limit=24$/)
    );

    expect(await within(region).findByText('Second')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Show less$/i })).toBeInTheDocument();
  });
});
