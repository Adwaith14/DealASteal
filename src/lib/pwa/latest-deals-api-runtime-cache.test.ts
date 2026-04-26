/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import {
  LATEST_DEALS_API_PATHNAME,
  LATEST_DEALS_SW_CACHE_NAME,
  createLatestDealsListRuntimeCaching,
} from './latest-deals-api-runtime-cache';

describe('createLatestDealsListRuntimeCaching', () => {
  it('exports stable cache name and path', () => {
    expect(LATEST_DEALS_API_PATHNAME).toBe('/api/deals/latest');
    expect(LATEST_DEALS_SW_CACHE_NAME).toContain('deals-latest');
  });

  it('matches same-origin GET /api/deals/latest', () => {
    const { matcher } = createLatestDealsListRuntimeCaching();
    const ok = matcher({
      sameOrigin: true,
      url: new URL('https://example.com/api/deals/latest?page=1&pageSize=36'),
      request: new Request('https://example.com/api/deals/latest?page=1'),
      event: {} as ExtendableEvent,
    });
    expect(ok).toBeTruthy();
  });

  it('does not match other API paths', () => {
    const { matcher } = createLatestDealsListRuntimeCaching();
    const bad = matcher({
      sameOrigin: true,
      url: new URL('https://example.com/api/deals/top'),
      request: new Request('https://example.com/api/deals/top'),
      event: {} as ExtendableEvent,
    });
    expect(bad).toBeFalsy();
  });

  it('does not match cross-origin', () => {
    const { matcher } = createLatestDealsListRuntimeCaching();
    const bad = matcher({
      sameOrigin: false,
      url: new URL('https://example.com/api/deals/latest'),
      request: new Request('https://example.com/api/deals/latest'),
      event: {} as ExtendableEvent,
    });
    expect(bad).toBeFalsy();
  });
});
