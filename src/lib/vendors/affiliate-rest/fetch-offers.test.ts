/** @vitest-environment node */
import { describe, expect, it, vi } from 'vitest';
import { fetchAffiliateRestOffersPage } from './fetch-offers';

describe('fetchAffiliateRestOffersPage', () => {
  it('parses a valid offers page', async () => {
    const fetchImpl = vi.fn(async () =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          offers: [
            {
              external_id: 'abc-1',
              title: 'Desk Lamp',
              sale_price: 25,
              list_price: 45,
              affiliate_url: 'https://track.example.com/offer/abc-1',
            },
          ],
          next_cursor: 'cursor-2',
        }),
      } as Response)
    );

    const page = await fetchAffiliateRestOffersPage({
      endpoint: 'https://api.example.com/offers',
      limit: 50,
      cursor: 'cursor-1',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(page.offers).toHaveLength(1);
    expect(page.next_cursor).toBe('cursor-2');
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('wraps low-level fetch failures with the request URL', async () => {
    const fetchImpl = vi.fn(async () =>
      Promise.reject(new Error('fetch failed'))
    );

    await expect(
      fetchAffiliateRestOffersPage({
        endpoint: 'https://api.example.com/offers',
        limit: 10,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).rejects.toThrow(/Affiliate REST fetch failed \(https:\/\/api\.example\.com\/offers\?limit=10\)/);
  });
});
