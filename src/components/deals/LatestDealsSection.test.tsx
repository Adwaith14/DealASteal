import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Deal } from '@/types/database.types';
import { LatestDealsSection } from './LatestDealsSection';

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
    ingest_external_id: null,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe('LatestDealsSection', () => {
  it('hides load more when all deals are already rendered', () => {
    const deals = Array.from({ length: 4 }, (_, i) => buildDeal(String(i + 1)));
    render(<LatestDealsSection initialDeals={deals} total={4} origin="https://example.test" />);

    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    expect(screen.getByText("You've seen all 4 deals — check back for fresh steals!")).toBeInTheDocument();
  });

  it('loads next latest page and appends cards', async () => {
    const initialDeals = Array.from({ length: 3 }, (_, i) => buildDeal(String(i + 1)));
    const nextDeals = Array.from({ length: 2 }, (_, i) => buildDeal(`n-${i + 1}`));

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ deals: nextDeals, total: 10 }),
    } as Response);

    render(<LatestDealsSection initialDeals={initialDeals} total={10} origin="https://example.test" />);
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));

    await waitFor(() => expect(screen.getAllByTestId('deal-card')).toHaveLength(5));
    expect(fetchMock).toHaveBeenCalledWith('/api/deals/latest?page=2&pageSize=36');
    expect(screen.getByText('5 of 10 deals loaded')).toBeInTheDocument();
  });

  it('shows fetchError from API when load more returns a Supabase-style failure', async () => {
    const initialDeals = Array.from({ length: 3 }, (_, i) => buildDeal(String(i + 1)));

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        deals: [],
        total: 10,
        fetchError: 'column deals.ingest_external_id does not exist',
      }),
    } as Response);

    render(<LatestDealsSection initialDeals={initialDeals} total={10} origin="https://example.test" />);
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));

    await waitFor(() =>
      expect(
        screen.getByText('column deals.ingest_external_id does not exist')
      ).toBeInTheDocument()
    );
    expect(screen.getAllByTestId('deal-card')).toHaveLength(3);
  });
});
