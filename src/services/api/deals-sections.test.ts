/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const builder = {
  select: vi.fn(),
  eq: vi.fn(),
  gte: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
};

const fromMock = vi.fn(() => builder);

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerAnon: () => ({ from: fromMock }),
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.gte.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.range.mockReset();
});

describe('deals sections fallbacks', () => {
  it('getTopDeals falls back when strict top query is empty', async () => {
    builder.range
      .mockResolvedValueOnce({ data: [], count: 0, error: null })
      .mockResolvedValueOnce({
        data: [{ id: 'd1', discount_percentage: 33 }],
        count: 1,
        error: null,
      });

    const { getTopDeals } = await import('./deals-sections');
    const result = await getTopDeals({ limit: 6, offset: 0 });

    expect(builder.range).toHaveBeenCalledTimes(2);
    expect(result.total).toBe(1);
    expect(result.deals).toHaveLength(1);
  });

  it('getHotDeals falls back when loot-only query is empty', async () => {
    builder.range
      .mockResolvedValueOnce({ data: [], count: 0, error: null })
      .mockResolvedValueOnce({
        data: [{ id: 'd2', is_loot_deal: false }],
        count: 1,
        error: null,
      });

    const { getHotDeals } = await import('./deals-sections');
    const result = await getHotDeals({ limit: 6, offset: 0 });

    expect(builder.range).toHaveBeenCalledTimes(2);
    expect(result.total).toBe(1);
    expect(result.deals).toHaveLength(1);
  });
});
