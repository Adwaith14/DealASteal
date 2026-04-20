/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Deal } from '@/types/database.types';

const builder = {
  select: vi.fn(),
  eq: vi.fn(),
  ilike: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
  maybeSingle: vi.fn(),
};

const fromMock = vi.fn(() => builder);

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerAnon: () => ({ from: fromMock }),
}));

function wireListChain() {
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.ilike.mockReturnValue(builder);
  builder.gte.mockReturnValue(builder);
  builder.lte.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
}

function wireSingleChain() {
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.maybeSingle.mockReset();
}

function sampleDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'd1',
    merchant_id: 'm1',
    title: 'Sample',
    description: null,
    original_price: 10,
    discount_price: 8,
    discount_percentage: 20,
    affiliate_url: 'https://example.com',
    image_url: null,
    is_loot_deal: false,
    is_active: true,
    expires_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    category_slug: null,
    ...overrides,
  };
}

describe('getActiveDeals', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    fromMock.mockReset();
    builder.select.mockReset();
    builder.eq.mockReset();
    builder.ilike.mockReset();
    builder.gte.mockReset();
    builder.lte.mockReset();
    builder.order.mockReset();
    builder.range.mockReset();
    builder.maybeSingle.mockReset();
    fromMock.mockImplementation(() => builder);
    wireListChain();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok:false and logs when the query fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    builder.range.mockResolvedValue({
      data: null,
      error: { message: 'query failed', code: 'TEST', hint: 'hint', details: 'd' },
      count: null,
    });

    const { getActiveDeals } = await import('./deals');
    const result = await getActiveDeals();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.deals).toEqual([]);
      expect(result.error).toContain('query failed');
      expect(result.code).toBe('TEST');
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[DealASteal] getActiveDeals failed:',
      expect.objectContaining({ message: 'query failed' })
    );

    expect(fromMock).toHaveBeenCalledWith('deals');
    expect(builder.select).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('is_active', true);
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(builder.range).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('maps undefined category_slug column (42703) to a migration hint', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    builder.range.mockResolvedValue({
      data: null,
      error: {
        message: 'column deals.category_slug does not exist',
        code: '42703',
      },
      count: null,
    });

    const { getActiveDeals } = await import('./deals');
    const result = await getActiveDeals();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('deals.category_slug');
      expect(result.error).toContain('20260415190000_add_category_slug_to_deals.sql');
      expect(result.code).toBe('42703');
    }

    consoleErrorSpy.mockRestore();
  });

  it('returns ok:true with deals and pagination when the query succeeds', async () => {
    const rows = [sampleDeal({ id: 'new' }), sampleDeal({ id: 'old' })];
    builder.range.mockResolvedValue({ data: rows, error: null, count: 42 });

    const { getActiveDeals } = await import('./deals');
    const result = await getActiveDeals({ page: 1, pageSize: 24 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.deals).toEqual(rows);
      expect(result.totalCount).toBe(42);
      expect(result.totalPages).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(24);
      expect(result.appliedQuery).toBe('');
      expect(result.appliedCategorySlug).toBeNull();
      expect(result.appliedStore).toBeNull();
      expect(result.appliedMinDiscount).toBeNull();
      expect(result.appliedMaxPrice).toBeNull();
    }
  });

  it('returns ok:true with empty deals when data is null without an error', async () => {
    builder.range.mockResolvedValue({ data: null, error: null, count: 0 });

    const { getActiveDeals } = await import('./deals');
    const result = await getActiveDeals();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.deals).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.appliedQuery).toBe('');
      expect(result.appliedCategorySlug).toBeNull();
      expect(result.appliedStore).toBeNull();
      expect(result.appliedMinDiscount).toBeNull();
      expect(result.appliedMaxPrice).toBeNull();
    }
  });

  it('returns ok:false when the client throws', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    builder.range.mockRejectedValue(new Error('network failure'));

    const { getActiveDeals } = await import('./deals');
    const result = await getActiveDeals();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.deals).toEqual([]);
      expect(result.error).toContain('network failure');
    }
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[DealASteal] getActiveDeals failed:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('applies ilike when query is non-empty', async () => {
    builder.range.mockResolvedValue({ data: [], error: null, count: 0 });
    const { getActiveDeals } = await import('./deals');
    const result = await getActiveDeals({ query: 'usb' });
    expect(builder.ilike).toHaveBeenCalledWith('title', '%usb%');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.appliedQuery).toBe('usb');
    }
  });

  it('applies eq filter for a known category slug', async () => {
    builder.range.mockResolvedValue({ data: [], error: null, count: 0 });
    const { getActiveDeals } = await import('./deals');
    const result = await getActiveDeals({ category: 'tech' });
    expect(builder.eq).toHaveBeenCalledWith('category_slug', 'tech');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.appliedCategorySlug).toBe('tech');
    }
  });

  it('ignores unknown category slugs', async () => {
    builder.range.mockResolvedValue({ data: [], error: null, count: 0 });
    const { getActiveDeals } = await import('./deals');
    const result = await getActiveDeals({ category: 'not-a-real-slug' });
    expect(builder.eq).not.toHaveBeenCalledWith(
      'category_slug',
      'not-a-real-slug'
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.appliedCategorySlug).toBeNull();
    }
  });

  it('applies affiliate_url ilike for a known store key', async () => {
    builder.range.mockResolvedValue({ data: [], error: null, count: 0 });
    const { getActiveDeals } = await import('./deals');
    const result = await getActiveDeals({ store: 'amazon' });
    expect(builder.ilike).toHaveBeenCalledWith('affiliate_url', '%amazon%');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.appliedStore).toBe('amazon');
    }
  });

  it('applies gte/lte for discount and price caps', async () => {
    builder.range.mockResolvedValue({ data: [], error: null, count: 0 });
    const { getActiveDeals } = await import('./deals');
    const result = await getActiveDeals({ minDiscount: 25, maxPrice: 100 });
    expect(builder.gte).toHaveBeenCalledWith('discount_percentage', 25);
    expect(builder.lte).toHaveBeenCalledWith('discount_price', 100);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.appliedMinDiscount).toBe(25);
      expect(result.appliedMaxPrice).toBe(100);
    }
  });

  it('drops out-of-range facet numbers', async () => {
    builder.range.mockResolvedValue({ data: [], error: null, count: 0 });
    const { getActiveDeals } = await import('./deals');
    const result = await getActiveDeals({ minDiscount: 33, maxPrice: 77 });
    expect(builder.gte).not.toHaveBeenCalled();
    expect(builder.lte).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.appliedMinDiscount).toBeNull();
      expect(result.appliedMaxPrice).toBeNull();
    }
  });
});

describe('getActiveDealById', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    fromMock.mockReset();
    builder.select.mockReset();
    builder.eq.mockReset();
    builder.maybeSingle.mockReset();
    fromMock.mockImplementation(() => builder);
    wireSingleChain();
  });

  it('returns invalid_id for bad UUID', async () => {
    const { getActiveDealById } = await import('./deals');
    const result = await getActiveDealById('not-a-uuid');
    expect(result).toEqual({
      ok: false,
      error: 'invalid_id',
      message: 'Deal id must be a valid UUID',
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('returns not_found when row is missing', async () => {
    builder.maybeSingle.mockResolvedValue({ data: null, error: null });
    const { getActiveDealById } = await import('./deals');
    const result = await getActiveDealById('550e8400-e29b-41d4-a716-446655440000');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('not_found');
    }
  });

  it('returns ok:true with deal when found', async () => {
    const row = sampleDeal({ id: '550e8400-e29b-41d4-a716-446655440000' });
    builder.maybeSingle.mockResolvedValue({ data: row, error: null });
    const { getActiveDealById } = await import('./deals');
    const result = await getActiveDealById('550e8400-e29b-41d4-a716-446655440000');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.deal).toEqual(row);
    }
  });

  it('maps undefined category_slug column on detail fetch to a migration hint', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    builder.maybeSingle.mockResolvedValue({
      data: null,
      error: {
        message: 'column deals.category_slug does not exist',
        code: '42703',
      },
    });

    const { getActiveDealById } = await import('./deals');
    const result = await getActiveDealById('550e8400-e29b-41d4-a716-446655440000');

    expect(result.ok).toBe(false);
    if (!result.ok && result.error === 'database_error') {
      expect(result.message).toContain('deals.category_slug');
      expect(result.message).toContain('20260415190000_add_category_slug_to_deals.sql');
      expect(result.code).toBe('42703');
    }

    consoleErrorSpy.mockRestore();
  });
});
