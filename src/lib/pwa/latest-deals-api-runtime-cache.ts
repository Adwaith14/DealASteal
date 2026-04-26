import { ExpirationPlugin, StaleWhileRevalidate } from 'serwist';
import type { RuntimeCaching } from 'serwist';

export const LATEST_DEALS_API_PATHNAME = '/api/deals/latest';
export const LATEST_DEALS_SW_CACHE_NAME = 'das-api-deals-latest-v1';

/**
 * Stale-while-revalidate for the public latest-deals feed so offline / flaky
 * networks can still show the last successful list (first route wins in Serwist).
 */
export function createLatestDealsListRuntimeCaching(): RuntimeCaching {
  return {
    method: 'GET',
    matcher: ({ sameOrigin, url }) =>
      sameOrigin && url.pathname === LATEST_DEALS_API_PATHNAME,
    handler: new StaleWhileRevalidate({
      cacheName: LATEST_DEALS_SW_CACHE_NAME,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
          maxAgeFrom: 'last-used',
        }),
      ],
    }),
  };
}
