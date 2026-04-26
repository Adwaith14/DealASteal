/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const getUser = vi.fn();
const insert = vi.fn();
const from = vi.fn(() => ({ insert }));

vi.mock('@/lib/supabase/ssr-server', () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      auth: { getUser },
    }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({ from }),
}));

describe('POST /api/coupon-use', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    insert.mockResolvedValue({ data: null, error: null });
  });

  it('records coupon usage', async () => {
    const res = await POST(
      new Request('http://localhost/api/coupon-use', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'user-agent': 'test-agent' },
        body: JSON.stringify({
          couponId: '660e8400-e29b-41d4-a716-446655440001',
          dealId: '660e8400-e29b-41d4-a716-446655440002',
        }),
      })
    );
    expect(res.status).toBe(204);
    expect(from).toHaveBeenCalledWith('coupon_use_events');
    expect(insert).toHaveBeenCalledTimes(1);
  });
});
