/** @vitest-environment node */
import { describe, expect, it, vi } from 'vitest';
import { fetchDummyJsonProductsPage } from './fetch-products';

describe('fetchDummyJsonProductsPage', () => {
  it('parses a mocked JSON page', async () => {
    const body = {
      products: [
        {
          id: 1,
          title: 'Test',
          price: 10,
          discountPercentage: 0,
          thumbnail: 'https://example.com/t.webp',
        },
      ],
      total: 1,
      skip: 0,
      limit: 10,
    };

    const fetchImpl = vi.fn(async () =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => body,
      } as Response)
    );

    const page = await fetchDummyJsonProductsPage({
      limit: 10,
      skip: 0,
      baseUrl: 'https://dummyjson.com',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(page.products).toHaveLength(1);
    expect(page.total).toBe(1);
    expect(fetchImpl).toHaveBeenCalled();
  });
});
