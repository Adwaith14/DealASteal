/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mvBuilder = {
  select: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  maybeSingle: vi.fn(),
};

const dealBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
};

const fromMock = vi.fn((table: string) => {
  if (table === 'best_deals_today') return mvBuilder;
  if (table === 'deals') return dealBuilder;
  throw new Error(`unexpected table ${table}`);
});

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerAnon: () => ({ from: fromMock }),
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mvBuilder.select.mockReturnValue(mvBuilder);
  mvBuilder.order.mockReturnValue(mvBuilder);
  mvBuilder.limit.mockReturnValue(mvBuilder);
  mvBuilder.maybeSingle.mockReset();
  dealBuilder.select.mockReturnValue(dealBuilder);
  dealBuilder.eq.mockReturnValue(dealBuilder);
  dealBuilder.maybeSingle.mockReset();
});

describe('getBestDealOfDay', () => {
  it('returns null when the materialised view is empty', async () => {
    mvBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

    const { getBestDealOfDay } = await import('./deals-sections');
    const out = await getBestDealOfDay();
    expect(out.deal).toBeNull();
    expect(out.fetchError).toBeUndefined();
  });

  it('hydrates the top MV row from deals', async () => {
    const dealRow = {
      id: '00000000-0000-4000-8000-0000000000aa',
      merchant_id: '00000000-0000-4000-8000-0000000000bb',
      title: 'Hero item',
      description: null,
      original_price: 100,
      discount_price: 40,
      discount_percentage: 60,
      affiliate_url: 'https://example.com',
      image_url: null,
      is_loot_deal: true,
      is_active: true,
      expires_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      category_slug: null,
      ingest_external_id: null,
      score: 88,
    };

    mvBuilder.maybeSingle.mockResolvedValue({ data: { id: dealRow.id }, error: null });
    dealBuilder.maybeSingle.mockResolvedValue({ data: dealRow, error: null });

    const { getBestDealOfDay } = await import('./deals-sections');
    const out = await getBestDealOfDay();
    expect(out.deal?.id).toBe(dealRow.id);
    expect(out.deal?.title).toBe('Hero item');
    expect(out.fetchError).toBeUndefined();
    expect(dealBuilder.eq).toHaveBeenCalledWith('is_active', true);
  });
});
