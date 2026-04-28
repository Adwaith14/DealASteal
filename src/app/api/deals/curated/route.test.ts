/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

vi.mock('@/services/api/deals-sections', () => ({
  getCuratedDeals: vi.fn(),
}));

describe('GET /api/deals/curated', () => {
  beforeEach(async () => {
    const { getCuratedDeals } = await import('@/services/api/deals-sections');
    vi.mocked(getCuratedDeals).mockReset();
  });

  it('returns 400 when sort is missing or invalid', async () => {
    const req = new NextRequest('http://localhost/api/deals/curated');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it('returns deals for valid sort', async () => {
    const { getCuratedDeals } = await import('@/services/api/deals-sections');
    vi.mocked(getCuratedDeals).mockResolvedValue({
      deals: [
        {
          id: 'd1',
          merchant_id: 'm1',
          title: 'One',
          description: null,
          original_price: 10,
          discount_price: 8,
          discount_percentage: 20,
          affiliate_url: 'https://x.com',
          image_url: null,
          is_loot_deal: false,
          is_active: true,
          expires_at: null,
          created_at: '2026-01-01T00:00:00.000Z',
          category_slug: null,
          ingest_external_id: null,
          merchant_name: 'Store',
        },
      ],
    });

    const req = new NextRequest('http://localhost/api/deals/curated?sort=newest&limit=12');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.deals).toHaveLength(1);
    expect(getCuratedDeals).toHaveBeenCalledWith('newest', 12);
  });

  it('returns 503 when upstream reports fetchError', async () => {
    const { getCuratedDeals } = await import('@/services/api/deals-sections');
    vi.mocked(getCuratedDeals).mockResolvedValue({
      deals: [],
      fetchError: 'Database unavailable',
    });

    const req = new NextRequest('http://localhost/api/deals/curated?sort=popular');
    const res = await GET(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('Database');
  });
});
