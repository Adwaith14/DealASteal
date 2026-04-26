import { describe, expect, it } from 'vitest';
import { cacheHeaders } from '@/lib/http/cache-headers';

describe('cacheHeaders', () => {
  it('shortFeed sets CDN s-maxage for Vercel edge caching', () => {
    const h = cacheHeaders('shortFeed');
    expect(h['Cache-Control']).toContain('s-maxage=');
    expect(h['Cache-Control']).toContain('stale-while-revalidate');
  });

  it('noStore is private', () => {
    expect(cacheHeaders('noStore')['Cache-Control']).toContain('no-store');
  });
});
