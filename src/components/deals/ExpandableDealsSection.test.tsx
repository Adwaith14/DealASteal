import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Deal } from '@/types/database.types';
import { ExpandableDealsSection } from './ExpandableDealsSection';

vi.mock('./DealCard', () => ({
  DealCard: ({ deal }: { deal: Deal }) => <div data-testid="deal-card">{deal.id}</div>,
}));

function buildDeal(id: string): Deal {
  return {
    id,
    merchant_id: `merchant-${id}`,
    created_at: '2026-04-20T12:00:00.000Z',
    title: `Deal ${id}`,
    description: null,
    original_price: 100,
    discount_price: 50,
    discount_percentage: 50,
    affiliate_url: `https://example.com/${id}`,
    image_url: null,
    is_loot_deal: false,
    is_active: true,
    expires_at: null,
    category_slug: null,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe('ExpandableDealsSection', () => {
  it('renders empty placeholder when section has no deals', () => {
    render(
      <ExpandableDealsSection type="top" initialDeals={[]} total={0} origin="https://example.test" />
    );
    expect(screen.getByText('No deals available in this section right now.')).toBeInTheDocument();
  });

  it('shows first 6 deals and remaining count banner', () => {
    const deals = Array.from({ length: 8 }, (_, i) => buildDeal(String(i + 1)));
    render(
      <ExpandableDealsSection type="top" initialDeals={deals} total={50} origin="https://example.test" />
    );

    expect(screen.getAllByTestId('deal-card')).toHaveLength(6);
    expect(screen.getByText('44 more top deals waiting')).toBeInTheDocument();
  });

  it('loads and expands to all deals when see all is clicked', async () => {
    const initialDeals = Array.from({ length: 6 }, (_, i) => buildDeal(String(i + 1)));
    const fetchedDeals = Array.from({ length: 12 }, (_, i) => buildDeal(`f-${i + 1}`));

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ deals: fetchedDeals, total: 12 }),
    } as Response);

    render(
      <ExpandableDealsSection
        type="hot"
        initialDeals={initialDeals}
        total={30}
        origin="https://example.test"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /see all/i }));

    await waitFor(() => expect(screen.getAllByTestId('deal-card')).toHaveLength(12));
    expect(fetchMock).toHaveBeenCalledWith('/api/deals/hot?offset=0&limit=96');
    expect(screen.getByText('Showing all 30 hot deals')).toBeInTheDocument();
  });
});
