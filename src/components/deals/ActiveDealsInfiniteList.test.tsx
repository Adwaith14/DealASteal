/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActiveDealsInfiniteList } from './ActiveDealsInfiniteList';

vi.mock('@/components/deals/DealsCatalogCard', () => ({
  DealsCatalogCard: ({ deal }: { deal: { id: string; title: string } }) => <div>{deal.title}</div>,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ActiveDealsInfiniteList', () => {
  it('syncs pagination when browse props change (e.g. new filter from URL)', () => {
    const { rerender } = render(
      <ActiveDealsInfiniteList
        variant="catalog"
        initialDeals={[{ id: 'a', title: 'Only' } as never]}
        initialPage={1}
        totalPages={1}
        pageSize={12}
        filterParams={{ category: 'tech' }}
      />
    );
    expect(screen.queryByRole('button', { name: /^Show more$/i })).not.toBeInTheDocument();

    rerender(
      <ActiveDealsInfiniteList
        variant="catalog"
        initialDeals={[{ id: 'a', title: 'Only' } as never]}
        initialPage={1}
        totalPages={3}
        pageSize={12}
        filterParams={{}}
      />
    );
    expect(screen.getByRole('button', { name: /^Show more$/i })).toBeInTheDocument();
  });

  it('appends deals when Show more succeeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ok: true,
          deals: [{ id: 'b', title: 'Second' }],
          page: 2,
          pageSize: 12,
          totalPages: 2,
          totalCount: 13,
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ActiveDealsInfiniteList
        variant="catalog"
        initialDeals={[{ id: 'a', title: 'First' } as never]}
        initialPage={1}
        totalPages={2}
        pageSize={12}
        filterParams={{}}
      />
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    const showMore = screen.getByRole('button', { name: /^Show more$/i });
    expect(showMore.parentElement).toHaveClass('justify-end');
    fireEvent.click(showMore);
    expect(await screen.findByText('Second')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
  });
});
