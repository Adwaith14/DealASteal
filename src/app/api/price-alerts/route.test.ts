/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET, POST } from './route';

const getUser = vi.fn();
const from = vi.fn();

vi.mock('@/lib/supabase/ssr-server', () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      auth: { getUser },
      from,
    }),
}));

describe('/api/price-alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: null } });
  });

  it('GET returns 401 without session', async () => {
    const req = new NextRequest('http://localhost/api/price-alerts?dealId=550e8400-e29b-41d4-a716-446655440000');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('POST returns 401 without session', async () => {
    const req = new NextRequest('http://localhost/api/price-alerts', {
      method: 'POST',
      body: JSON.stringify({ dealId: '550e8400-e29b-41d4-a716-446655440000', thresholdPrice: 10 }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST creates alert when signed in', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
    });
    from.mockImplementation((table: string) => {
      if (table === 'deals') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    discount_price: 100,
                    currency: 'USD',
                    is_active: true,
                  },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === 'price_alerts') {
        return {
          upsert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: 'pa1', threshold_price: 50 },
                  error: null,
                }),
            }),
          }),
        };
      }
      return {};
    });
    const req = new NextRequest('http://localhost/api/price-alerts', {
      method: 'POST',
      body: JSON.stringify({ dealId: '550e8400-e29b-41d4-a716-446655440000', thresholdPrice: 50 }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('DELETE returns 204', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
    });
    from.mockImplementation((table: string) => {
      if (table === 'price_alerts') {
        return {
          delete: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          }),
        };
      }
      return {};
    });
    const req = new NextRequest('http://localhost/api/price-alerts?id=550e8400-e29b-41d4-a716-446655440000', {
      method: 'DELETE',
    });
    const res = await DELETE(req);
    expect(res.status).toBe(204);
  });
});
