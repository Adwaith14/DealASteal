/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { invalidateSavedDealIdsCache, loadSavedDealIdsCached } from './saved-deals-client-cache';

afterEach(() => {
  invalidateSavedDealIdsCache();
  vi.restoreAllMocks();
});

describe('saved-deals-client-cache', () => {
  it('dedupes concurrent loads into one fetch', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ dealIds: ['a', 'b'] }),
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const [one, two] = await Promise.all([loadSavedDealIdsCached(), loadSavedDealIdsCached()]);
    expect(one).toEqual(['a', 'b']);
    expect(two).toEqual(['a', 'b']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('invalidate allows a second fetch', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ dealIds: ['x'] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ dealIds: ['y'] }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadSavedDealIdsCached()).resolves.toEqual(['x']);
    invalidateSavedDealIdsCache();
    await expect(loadSavedDealIdsCached()).resolves.toEqual(['y']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
