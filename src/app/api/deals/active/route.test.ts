/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

vi.mock('@/services/api/deals', () => ({
  getActiveDeals: vi.fn(),
}));

describe('GET /api/deals/active', () => {
  beforeEach(async () => {
    const { getActiveDeals } = await import('@/services/api/deals');
    vi.mocked(getActiveDeals).mockReset();
  });

  it('proxies getActiveDeals success', async () => {
    const { getActiveDeals } = await import('@/services/api/deals');
    vi.mocked(getActiveDeals).mockResolvedValue({
      ok: true,
      deals: [],
      page: 1,
      pageSize: 12,
      totalCount: 0,
      totalPages: 1,
      appliedQuery: '',
      appliedCategorySlug: null,
      appliedStore: null,
      appliedMinDiscount: null,
      appliedMaxPrice: null,
      appliedLootOnly: false,
      appliedSort: null,
    });

    const req = new NextRequest('http://localhost/api/deals/active?page=1&pageSize=12');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(getActiveDeals).toHaveBeenCalled();
  });

  it('returns 502 when getActiveDeals fails', async () => {
    const { getActiveDeals } = await import('@/services/api/deals');
    vi.mocked(getActiveDeals).mockResolvedValue({
      ok: false,
      deals: [],
      error: 'boom',
    });

    const req = new NextRequest('http://localhost/api/deals/active');
    const res = await GET(req);
    expect(res.status).toBe(502);
  });
});
