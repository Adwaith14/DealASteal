/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const builder = {
  select: vi.fn(),
  eq: vi.fn(),
  or: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
};
const fromMock = vi.fn(() => builder);

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerAnon: () => ({ from: fromMock }),
}));

describe('getApplicableCouponsForDeal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.or.mockReturnValue(builder);
    builder.order.mockReturnValue(builder);
    builder.limit.mockResolvedValue({ data: [], error: null });
  });

  it('queries direct + merchant-wide coupons', async () => {
    const { getApplicableCouponsForDeal } = await import('./coupons');
    const result = await getApplicableCouponsForDeal(
      '660e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440000'
    );
    expect(result.ok).toBe(true);
    expect(builder.or).toHaveBeenCalledWith(
      'deal_id.eq.660e8400-e29b-41d4-a716-446655440001,and(deal_id.is.null,merchant_id.eq.550e8400-e29b-41d4-a716-446655440000)'
    );
  });
});
