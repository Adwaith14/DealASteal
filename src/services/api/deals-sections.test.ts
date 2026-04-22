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
  it('getLatestDeals returns empty when PostgREST returns an error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    builder.range.mockResolvedValueOnce({
      data: null,
      count: null,
      error: { message: 'column deals.ingest_external_id does not exist', code: '42703' },
    });

    const { getLatestDeals } = await import('./deals-sections');
    const result = await getLatestDeals({ page: 1, pageSize: 10 });

    expect(result.deals).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.fetchError).toContain('ingest_external_id');
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('getTopDeals returns empty when strict query errors (no fallback)', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    builder.range.mockResolvedValueOnce({
      data: null,
      count: null,
      error: { message: 'permission denied', code: '42501' },
    });

    const { getTopDeals } = await import('./deals-sections');
    const result = await getTopDeals({ limit: 6, offset: 0 });

    expect(result.deals).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.fetchError).toBe('permission denied');
    expect(builder.range).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('getTopDeals returns empty when fallback query errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    builder.range
      .mockResolvedValueOnce({ data: [], count: 0, error: null })
      .mockResolvedValueOnce({
        data: null,
        count: null,
        error: { message: 'schema cache', code: 'PGRST' },
      });

    const { getTopDeals } = await import('./deals-sections');
    const result = await getTopDeals({ limit: 6, offset: 0 });

    expect(result.deals).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.fetchError).toBe('schema cache');
    expect(builder.range).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

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
