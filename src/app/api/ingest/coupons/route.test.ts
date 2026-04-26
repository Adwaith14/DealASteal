/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, PATCH, POST } from './route';

const revalidatePathMock = vi.fn();
const mockFrom = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: (path: string) => revalidatePathMock(path),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

describe('/api/ingest/coupons', () => {
  beforeEach(() => {
    vi.stubEnv('INGESTION_API_KEY', 'test-key');
    vi.clearAllMocks();
  });

  it('POST writes coupon', async () => {
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: '1' }, error: null })) })),
    }));
    mockFrom.mockReturnValue({ insert });
    const req = new NextRequest('http://localhost/api/ingest/coupons', {
      method: 'POST',
      headers: { authorization: 'Bearer test-key', 'content-type': 'application/json' },
      body: JSON.stringify({
        merchant_id: '550e8400-e29b-41d4-a716-446655440000',
        deal_id: '660e8400-e29b-41d4-a716-446655440001',
        code: 'SAVE10',
        title: 'Save 10%',
        discount_type: 'percent',
        discount_value: 10,
        affiliate_url: 'https://example.com/coupon',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockFrom).toHaveBeenCalledWith('coupons');
  });

  it('PATCH updates coupon', async () => {
    const update = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: '1' }, error: null })) })),
      })),
    }));
    mockFrom.mockReturnValue({ update });
    const req = new NextRequest('http://localhost/api/ingest/coupons', {
      method: 'PATCH',
      headers: { authorization: 'Bearer test-key', 'content-type': 'application/json' },
      body: JSON.stringify({ id: '660e8400-e29b-41d4-a716-446655440001', title: 'Updated' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it('DELETE soft-disables coupon', async () => {
    const update = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: '1' }, error: null })) })),
      })),
    }));
    mockFrom.mockReturnValue({ update });
    const req = new NextRequest('http://localhost/api/ingest/coupons', {
      method: 'DELETE',
      headers: { authorization: 'Bearer test-key', 'content-type': 'application/json' },
      body: JSON.stringify({ id: '660e8400-e29b-41d4-a716-446655440001' }),
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect(revalidatePathMock).toHaveBeenCalledWith('/');
  });
});
