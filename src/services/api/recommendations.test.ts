/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const clickBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
};
const clickedDealsBuilder = {
  select: vi.fn(),
  in: vi.fn(),
};
const candidatesBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
};

const fromMock = vi.fn((table: string) => {
  if (table === 'click_events') return clickBuilder;
  if (table === 'deals' && fromMock.mock.calls.filter((c) => c[0] === 'deals').length === 1) {
    return clickedDealsBuilder;
  }
  return candidatesBuilder;
});

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({ from: fromMock }),
}));

describe('getForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    clickBuilder.select.mockReturnValue(clickBuilder);
    clickBuilder.eq.mockReturnValue(clickBuilder);
    clickBuilder.order.mockReturnValue(clickBuilder);
    clickBuilder.limit.mockResolvedValue({
      data: [{ deal_id: 'd1' }, { deal_id: 'd2' }],
      error: null,
    });

    clickedDealsBuilder.select.mockReturnValue(clickedDealsBuilder);
    clickedDealsBuilder.in.mockResolvedValue({
      data: [
        { id: 'd1', category_slug: 'tech' },
        { id: 'd2', category_slug: 'tech' },
      ],
      error: null,
    });

    candidatesBuilder.select.mockReturnValue(candidatesBuilder);
    candidatesBuilder.eq.mockReturnValue(candidatesBuilder);
    candidatesBuilder.in.mockReturnValue(candidatesBuilder);
    candidatesBuilder.order.mockReturnValue(candidatesBuilder);
    candidatesBuilder.limit.mockResolvedValue({
      data: [
        {
          id: 'd1',
          category_slug: 'tech',
          is_loot_deal: false,
          score: 50,
        },
        {
          id: 'd3',
          category_slug: 'tech',
          is_loot_deal: true,
          score: 40,
        },
      ],
      error: null,
    });
  });

  it('returns active deals based on clicked category affinity excluding clicked ids', async () => {
    const { getForUser } = await import('./recommendations');
    const deals = await getForUser('u1', 4);
    expect(deals.map((d) => d.id)).toEqual(['d3']);
  });
});
