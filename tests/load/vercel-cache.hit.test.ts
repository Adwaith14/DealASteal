/** @vitest-environment node */
import { describe, expect, it } from 'vitest';

describe('Vercel CDN cache (deployed preview/prod)', () => {
  it.skipIf(!process.env.LOAD_TEST_BASE_URL)(
    'second GET /api/deals/latest returns x-vercel-cache and s-maxage Cache-Control',
    async () => {
      const base = process.env.LOAD_TEST_BASE_URL!.replace(/\/$/, '');
      await fetch(`${base}/api/deals/latest`);
      const r = await fetch(`${base}/api/deals/latest`);
      expect(r.headers.get('x-vercel-cache')).toBeTruthy();
      expect(r.headers.get('cache-control')?.toLowerCase()).toMatch(/s-maxage=/);
    }
  );
});
